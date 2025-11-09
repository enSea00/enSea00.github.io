#!/usr/bin/env python3
"""
Collate QLD tide CSV/TXT files and wave CSV files into per-site AllData CSVs.

Outputs (placed in data/tides/ and data/waves/):
  - data/tides/tide_coombabahst_AllData.csv      <- from tide_std_*.csv (only coombabahst)
  - data/tides/tide_tweedsbj_AllData.csv         <- from tide_storm_*.csv (only tweedsbj)
  - data/tides/tide_goldcoast_AllData.csv        <- from tide_storm_*.csv (only goldcoast)
  - data/tides/tide_Southport_AllData.csv        <- from tide_Southport_*.txt (all Southport files)
  - data/waves/wave_goldcoast_mk4_AllData.csv    <- from wave_*.csv (only Gold Coast Mk4)
  - data/waves/wave_brisbane_mk4_AllData.csv     <- from wave_*.csv (only Brisbane Mk4)
  - data/waves/wave_palmbeach_mk4_AllData.csv    <- from wave_*.csv (only Palm Beach Mk4)
  - data/waves/wave_bilinga_AllData.csv          <- from wave_*.csv (only Bilinga)
  - data/waves/wave_tweed_heads_mk4_AllData.csv  <- from wave_*.csv (only Tweed Heads Mk4)
  - data/waves/wave_tweed_offshore_AllData.csv   <- from wave_*.csv (only Tweed Offshore)

Behavior:
 - Attempts to detect a station/site column (common names like 'site', 'site_name', 'station', etc).
 - Matches sites case-insensitively; if no site column is found and the file name contains
   the site string, the file is assumed to belong to that site.
 - Deduplicates rows and writes final CSVs without an index.
 - Attempts to robustly read CSV/TXT files with different separators and encodings.
"""

from pathlib import Path
import pandas as pd
import glob
import sys

# Ensure directories exist
tides_dir = Path("data/tides")
waves_dir = Path("data/waves")
tides_dir.mkdir(parents=True, exist_ok=True)
waves_dir.mkdir(parents=True, exist_ok=True)

# Desired tide sites and where they come from
TIDE_SITES = {
    "coombabahst": {
        "from": "tide_std_*.csv",
        "match_terms": ["coombabahst"],
        "out_dir": tides_dir,
        "prefix": "tide",
    },
    "tweedsbj": {
        "from": "tide_storm_*.csv",
        "match_terms": ["tweedsbj"],
        "out_dir": tides_dir,
        "prefix": "tide",
    },
    "goldcoast": {
        "from": "tide_storm_*.csv",
        "match_terms": ["goldcoast"],
        "out_dir": tides_dir,
        "prefix": "tide",
    },
    # Southport txt files - keep the capitalised label to mirror existing file naming
    "Southport": {
        "from": "tide_Southport_*.txt",
        "match_terms": ["southport"],
        "out_dir": tides_dir,
        "prefix": "tide",
    },
}

# Desired wave sites and pattern (only collate these)
WAVE_SITES = {
    "goldcoast_mk4": {
        "from": "wave_*.csv",
        "match_terms": ["gold coast mk4", "gold coast mk 4", "goldcoast mk4", "goldcoastmk4", "gold coast", "goldcoast"],
        "out_dir": waves_dir,
        "prefix": "wave",
    },
    "brisbane_mk4": {
        "from": "wave_*.csv",
        "match_terms": ["brisbane mk4", "brisbane mk 4", "brisbanemk4", "brisbane"],
        "out_dir": waves_dir,
        "prefix": "wave",
    },
    "palmbeach_mk4": {
        "from": "wave_*.csv",
        "match_terms": ["palm beach mk4", "palm beach mk 4", "palmbeach mk4", "palmbeach"],
        "out_dir": waves_dir,
        "prefix": "wave",
    },
    "bilinga": {
        "from": "wave_*.csv",
        "match_terms": ["bilinga"],
        "out_dir": waves_dir,
        "prefix": "wave",
    },
    "tweed_heads_mk4": {
        "from": "wave_*.csv",
        "match_terms": ["tweed heads mk4", "tweed heads", "tweedheads", "tweed heads mk 4"],
        "out_dir": waves_dir,
        "prefix": "wave",
    },
    "tweed_offshore": {
        "from": "wave_*.csv",
        "match_terms": ["tweed offshore", "tweed_offshore", "tweedoffshore"],
        "out_dir": waves_dir,
        "prefix": "wave",
    },
}

# Candidate column names that might indicate station/site identifiers
SITE_COLUMN_CANDIDATES = [
    "site", "station", "station_name", "sitename", "site_name",
    "stn", "name", "location", "id", "station id", "stationid"
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
    # Try a few strategies to read the file: pandas autodetect, common separators, fallback.
    try:
        df = pd.read_csv(path, sep=None, engine="python", encoding="utf-8")
        return df
    except Exception:
        # try common separators
        for sep in [",", "\t", ";", "|"]:
            try:
                df = pd.read_csv(path, sep=sep, engine="python", encoding="utf-8")
                return df
            except Exception:
                continue
        # try whitespace-delimited
        try:
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


def collect_and_filter(pattern: str, match_terms: list, base_dir: Path):
    """
    Read all files matching 'pattern' in base_dir, filter rows containing any of match_terms
    in the detected site column (or infer from filename), and return a concatenated DataFrame.
    """
    files = sorted(glob.glob(str(base_dir / pattern)))
    frames = []
    for fp in files:
        p = Path(fp)
        print(f"Processing {p.name} in {base_dir}")
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
                # use simple contains; terms should be lowercased by caller
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


def process_site(site_label: str, cfg: dict):
    pattern = cfg["from"]
    terms = cfg["match_terms"]
    out_dir: Path = cfg.get("out_dir", tides_dir)
    prefix = cfg.get("prefix", "data")
    print(f"\n=== Collating for '{site_label}' from pattern '{pattern}' in {out_dir} ...")
    df = collect_and_filter(pattern, terms, out_dir) if out_dir != tides_dir else collect_and_filter(pattern, terms, out_dir)
    # Note: collect_and_filter will look into the provided base_dir for files matching the pattern.
    if df.empty:
        print(f"  -> No data found for {site_label}, skipping output.")
        return False

    # Try to sort by a datetime-like column if present
    datetime_cols = [c for c in df.columns if "date" in c.lower() or "time" in c.lower() or "datetime" in c.lower()]
    if datetime_cols:
        col = datetime_cols[0]
        try:
            df[col] = pd.to_datetime(df[col], errors="coerce")
            df = df.sort_values(by=col)
        except Exception:
            pass

    # write out to the requested out_dir (some configs use waves_dir, some tides_dir)
    out_fn = out_dir / f"{prefix}_{site_label}_AllData.csv"
    df.to_csv(out_fn, index=False)
    print(f"  -> wrote {len(df)} rows to {out_fn}")
    return True


def main():
    any_written = False

    # Process tides
    for site_label, cfg in TIDE_SITES.items():
        # TIDE_SITES refer to files in tides_dir; collect_and_filter will search the base_dir
        cfg = dict(cfg)  # shallow copy
        cfg["out_dir"] = cfg.get("out_dir", tides_dir)
        written = process_site(site_label, cfg)
        any_written = any_written or written

    # Process waves (wave files are in data/waves; but the downloaded files live in data/waves)
    # For waves we need to search data/waves for files matching the pattern, then filter by station/site.
    for site_label, cfg in WAVE_SITES.items():
        cfg = dict(cfg)
        cfg["out_dir"] = cfg.get("out_dir", waves_dir)
        # When collecting waves, the base_dir is waves_dir (where the workflow saves wave_YYYYMMDD.csv)
        # The collect_and_filter will only include rows where the site column contains any term in match_terms,
        # or the filename contains a match term.
        written = process_site(site_label, {**cfg, "from": cfg["from"]})
        any_written = any_written or written

    if not any_written:
        print("No outputs were written. Check that source files exist and contain the requested sites.")


if __name__ == "__main__":
    main()
