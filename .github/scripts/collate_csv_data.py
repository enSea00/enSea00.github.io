#!/usr/bin/env python3
"""
Collate QLD tide CSV/TXT files and wave CSV files into per-site AllData CSVs.

This version improves robustness for files that include a preamble line
such as "Tide Data provided @ 08:05hrs on 22-10-2025" before the CSV header.
It attempts to find the real header line within the first N lines and
skips preamble rows so the 'Site' column (and other expected columns)
are properly detected.
"""

from pathlib import Path
import pandas as pd
import glob
import sys
from io import StringIO

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
    """
    Try reading a CSV/TSV/text file robustly into a DataFrame.

    Additional logic: detect and skip preamble lines by scanning the first
    few dozen lines for a header row that contains a 'site' column and other
    expected headers (e.g., 'date', 'datetime', 'water').
    """
    # Read raw text first so we can detect preamble/header lines
    try:
        raw_text = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        try:
            raw_text = path.read_text(encoding="latin-1", errors="replace")
        except Exception as e:
            print(f"Failed to read {path}: {e}", file=sys.stderr)
            return pd.DataFrame()

    lines = raw_text.splitlines()
    header_idx = None
    max_scan = min(40, len(lines))

    # Look for a line that looks like the CSV header: it should contain one of the site candidates
    # and at least one of common other tokens (date/datetime/time/water/seconds)
    other_tokens = ("date", "datetime", "time", "water", "seconds", "prediction")
    for i in range(max_scan):
        low = lines[i].lower()
        if any(cand in low for cand in SITE_COLUMN_CANDIDATES) and any(tok in low for tok in other_tokens):
            header_idx = i
            # Found likely header line
            break

    if header_idx is not None:
        # Reconstruct starting from the header line and let pandas parse it.
        data_text = "\n".join(lines[header_idx:])
        try:
            df = pd.read_csv(StringIO(data_text), sep=None, engine="python")
            return df
        except Exception:
            # try common separators explicitly
            for sep in [",", "\t", ";", "|"]:
                try:
                    df = pd.read_csv(StringIO(data_text), sep=sep, engine="python")
                    return df
                except Exception:
                    continue
            # fall through to other strategies below
    else:
        # No obvious header detected; fall back to trying to read the entire file with pandas autodetect
        pass

    # Fallback strategies
    try:
        df = pd.read_csv(StringIO(raw_text), sep=None, engine="python", encoding="utf-8")
        return df
    except Exception:
        for sep in [",", "\t", ";", "|"]:
            try:
                df = pd.read_csv(StringIO(raw_text), sep=sep, engine="python", encoding="utf-8")
                return df
            except Exception:
                continue
        # try whitespace-delimited
        try:
            df = pd.read_csv(StringIO(raw_text), delim_whitespace=True, header=0, encoding="utf-8")
            return df
        except Exception:
            # last-resort: return each line as a row in a single 'raw' column
            try:
                return pd.DataFrame({"raw": lines})
            except Exception as e:
                print(f"Failed to parse {path}: {e}", file=sys.stderr)
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
    df = collect_and_filter(pattern, terms, out_dir)
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
        cfg = dict(cfg)  # shallow copy
        cfg["out_dir"] = cfg.get("out_dir", tides_dir)
        written = process_site(site_label, cfg)
        any_written = any_written or written

    # Process waves
    for site_label, cfg in WAVE_SITES.items():
        cfg = dict(cfg)
        cfg["out_dir"] = cfg.get("out_dir", waves_dir)
        written = process_site(site_label, cfg)
        any_written = any_written or written

    if not any_written:
        print("No outputs were written. Check that source files exist and contain the requested sites.")


if __name__ == "__main__":
    main()
