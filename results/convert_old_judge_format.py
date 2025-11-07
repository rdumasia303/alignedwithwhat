#!/usr/bin/env python3
"""
Convert old judge result format to new format.

Old format has:
- metadata.timestamp (YYYYMMDD_HHMMSS format)
- metadata.judge_run_id
- raw_response (JSON string that needs to be parsed)

New format has:
- metadata.judge_run_id, run_name, started_at (ISO format)
- metadata.evaluation_timestamp (ISO datetime)
- evaluation (parsed JSON object, not string)
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any


def parse_timestamp(timestamp_str: str) -> datetime:
    """Convert YYYYMMDD_HHMMSS to datetime."""
    return datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")


def convert_old_to_new_format(old_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert old judge file format to new format."""
    
    # Parse the raw_response JSON string into an object
    try:
        raw_response = old_data["raw_response"]
        
        # Strip markdown code fences if present (```json ... ```)
        if raw_response.startswith("```"):
            lines = raw_response.split('\n')
            # Remove first line (```json) and last line (```)
            lines = lines[1:-1]
            raw_response = '\n'.join(lines)
        
        evaluation = json.loads(raw_response)
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Error parsing raw_response: {e}", file=sys.stderr)
        print(f"First 200 chars of raw_response: {old_data.get('raw_response', '')[:200]}", file=sys.stderr)
        raise
    
    # Convert timestamp to ISO format
    timestamp_str = old_data["metadata"]["timestamp"]
    timestamp_dt = parse_timestamp(timestamp_str)
    started_at_iso = timestamp_dt.isoformat()
    
    # Build new metadata structure
    new_metadata = {
        "judge_run_id": old_data["metadata"]["judge_run_id"],
        "run_name": f"imported_judge_{timestamp_str}",
        "started_at": started_at_iso,
        "pair_id": old_data["metadata"]["pair_id"],
        "judge_model": old_data["metadata"]["judge_model"],
        "evaluation_timestamp": started_at_iso  # Use same timestamp for evaluation
    }
    
    # Build new structure
    new_data = {
        "metadata": new_metadata,
        "usage_info": old_data.get("usage_info", {}),
        "input_data": old_data["input_data"],
        "evaluation": evaluation  # Parsed, not string
    }
    
    return new_data


def convert_file(input_path: Path, output_path: Path = None):
    """Convert a single old-format file to new format."""
    
    if output_path is None:
        # Replace .json with _converted.json
        output_path = input_path.parent / f"{input_path.stem}_converted.json"
    
    print(f"Converting: {input_path}")
    print(f"Output to: {output_path}")
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
        
        new_data = convert_old_to_new_format(old_data)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Converted successfully")
        return True
    
    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        return False


def convert_directory(input_dir: Path, output_dir: Path = None):
    """Convert all old-format JSON files in a directory."""
    
    if output_dir is None:
        output_dir = input_dir / "converted"
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    json_files = list(input_dir.glob("judge_raw_*.json"))
    
    if not json_files:
        print(f"No judge_raw_*.json files found in {input_dir}")
        return
    
    print(f"Found {len(json_files)} files to convert\n")
    
    success_count = 0
    for json_file in json_files:
        # Create output filename: judge_raw_MP-X_timestamp.json -> judge_MP-X.json
        # Extract pair_id from filename
        stem = json_file.stem  # judge_raw_MP-AbusiveRelationships-45_20251005_195803
        parts = stem.split('_')
        pair_id = '_'.join(parts[2:-1])  # MP-AbusiveRelationships-45
        output_file = output_dir / f"judge_{pair_id}.json"
        
        if convert_file(json_file, output_file):
            success_count += 1
        print()
    
    print(f"\nConversion complete: {success_count}/{len(json_files)} files successful")


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python convert_old_judge_format.py <input_file_or_directory> [output_file_or_directory]")
        print()
        print("Examples:")
        print("  # Convert single file:")
        print("  python convert_old_judge_format.py results/judge_results/judge_raw_MP-X_20251005.json")
        print()
        print("  # Convert directory:")
        print("  python convert_old_judge_format.py results/judge_results/old_run/")
        print()
        print("  # Specify output:")
        print("  python convert_old_judge_format.py results/judge_results/old_run/ results/judge_results/converted/")
        sys.exit(1)
    
    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    
    if not input_path.exists():
        print(f"Error: {input_path} does not exist", file=sys.stderr)
        sys.exit(1)
    
    if input_path.is_file():
        convert_file(input_path, output_path)
    elif input_path.is_dir():
        convert_directory(input_path, output_path)
    else:
        print(f"Error: {input_path} is neither a file nor directory", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
