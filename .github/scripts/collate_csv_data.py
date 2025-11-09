#!/usr/bin/env python3
"""
Collate QLD tide CSV/TXT files into per-site AllData CSVs.

Outputs (placed in data/tides/):
  - data/tides/tide_coombabahst_AllData.csv      <- from tide_std_*.csv (only coombabahst)
  - data/tides/tide_tweedsbj_AllData.csv         <- from tide_storm_*.csv (only tweedsbj)
  - data/tides/tide_goldcoast_AllData.csv        <- from tide_storm_*.csv (only goldcoast)
  - data/tides/tide_Southport_AllData.csv        <- from tide_Southport_*.txt (all Southport files)

Behavior:
 - Attempts to detect a station/site column (common names like 'site', 'site_name', 'station', etc).
 - Matches sites case-insensitively; if no site column is found and the file name contains
   the site string, the file is assumed to belong to that site.
 - Deduplicates rows and writes final CSVs without an index.
"""

from pathlib import Path
import pandas as pd
import glob
import sys

tides_dir = Path("data/tides")
tides_dir.mkdir(parents=True, exist_ok=True)

# Desired sites and where they come from
# Key: output filename site label (used in tide_{site}_AllData.csv)
# Value: dict with patterns to gather from and lowercase match terms
SITES = {
    "coombabahst": {
        "from": "tide_std_*.csv",
        "match_terms": ["coombabahst"],
    },
    "tweedsbj": {
        "from": "tide_storm_*.csv",
        "match_terms": ["tweedsbj"],
    },
    "goldcoast": {
        "from": "tide_storm_*.csv",
        "match_terms": ["goldcoast"],
    },
    # Southport txt files - keep the capitalised label to mirror existing file naming
    "Southport": {
        "from": "tide_Southport_*.txt",
        "match_terms": ["southport"],
    },
}

# Candidate column names that might indicate station/site identifiers
SITE_COLUMN_CANDIDATES = [
    "site", "station", "station_name", "sitename", "site_name",
    "stn", "name", "location", "id"
]


def find_site_column(df: pd.DataFrame):
    """Return the column name in df that likely contains site/station information, or None."""
    cols_lower = {c.lower(): c for c in df.columns}
    for cand in SITE_COLUMN_CANDIDATES:
        if cand in cols_lower:
            return cols_lower[cand]
    return None


def read_any_csv(path: Path):
    """Try reading a CSV/TSV/text file robustly into a DataFrame."""
    try:
        # try autodetect separators
        df = pd.read_csv(path, sep=None, engine="python", encoding="utf-8")
        return df
    except Exception:
        try:
            # try whitespace-delimited
            df = pd.read_csv(path, delim_whitespace=True, header=0, encoding="utf-8")
            return df
        except Exception:
            # last-resort: read as a single-column text file
            try:
                with path.open("r", encoding="utf-8", errors="replace") as fh:
                    lines = [line.rstrip("\n") for line in fh]
                return pd.DataFrame({"raw": lines})
            except Exception as e:
                print(f"Failed to read {path}: {e}", file=sys.stderr)
                return pd.DataFrame()


def collect_and_filter(pattern: str, match_terms: list):
    """
    Read all files matching 'pattern' in data/tides, filter rows containing any of match_terms
    in the detected site column (or infer from filename), and return a concatenated DataFrame.
    """
    files = sorted(glob.glob(str(tides_dir / pattern)))
    frames = []
    for fp in files:
        p = Path(fp)
        print(f"Processing {p.name}")
        df = read_any_csv(p)
        if df.empty:
            print(f"  -> empty or unreadable: {p.name}")
            continue

        site_col = find_site_column(df)
        matched = pd.DataFrame()  # empty

        if site_col:
            # normalize values and match
            try:
                ser = df[site_col].astype(str).str.lower()
            except Exception:
                ser = df[site_col].astype(str).str.lower()
            mask = False
            for term in match_terms:
                mask = mask | ser.str.contains(term.lower(), na=False)
            matched = df[mask]
            print(f"  -> found site column '{site_col}', kept {len(matched)} rows matching {match_terms}")
        else:
            # No site column; try to infer from filename
            fname_low = p.name.lower()
            found = False
            for term in match_terms:
                if term.lower() in fname_low:
                    matched = df.copy()
                    found = True
                    print(f"  -> no site column, filename contains '{term}'; keeping entire file ({len(matched)} rows)")
                    break
            if not found:
                print(f"  -> no site column and filename doesn't match any of {match_terms}; skipping")

        if not matched.empty:
            frames.append(matched)

    if frames:
        combined = pd.concat(frames, ignore_index=True)
        # drop exact duplicates
        combined = combined.drop_duplicates()
        return combined
    else:
        return pd.DataFrame()


def main():
    any_written = False
    for site_label, cfg in SITES.items():
        pattern = cfg["from"]
        terms = cfg["match_terms"]
        print(f"\n=== Collating for site '{site_label}' from pattern '{pattern}' ...")
        df = collect_and_filter(pattern, terms)
        if df.empty:
            print(f"  -> No data found for {site_label}, skipping output.")
            continue

        # Try to sort by a datetime-like column if present
        datetime_cols = [c for c in df.columns if "date" in c.lower() or "time" in c.lower() or "datetime" in c.lower()]
        if datetime_cols:
            col = datetime_cols[0]
            try:
                df[col] = pd.to_datetime(df[col], errors="coerce")
                df = df.sort_values(by=col)
            except Exception:
                pass

        out_fn = tides_dir / f"tide_{site_label}_AllData.csv"
        df.to_csv(out_fn, index=False)
        print(f"  -> wrote {len(df)} rows to {out_fn}")
        any_written = True

    if not any_written:
        print("No outputs were written. Check that source files exist and contain the requested sites.")


if __name__ == "__main__":
    main()
