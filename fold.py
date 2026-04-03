import urllib.request
import urllib.error
import argparse
import sys
import os

def fold_sequence(sequence: str, output_file: str):
    """
    Submits an amino acid sequence to the ESMFold API and saves the resulting PDB file.
    """
    # Clean up the sequence (remove whitespaces/newlines)
    sequence = ''.join(sequence.split())
    
    # Validate basic sequence characters
    valid_chars = set("ACDEFGHIKLMNPQRSTVWY")
    if not all(c.upper() in valid_chars for c in sequence):
        print("Error: Sequence contains invalid amino acid characters.")
        sys.exit(1)
        
    print(f"Submitting sequence of length {len(sequence)} to ESMFold API...")
    url = "https://api.esmatlas.com/foldSequence/v1/pdb/"
    
    try:
        req = urllib.request.Request(url, data=sequence.encode('utf-8'), headers={'Content-Type': 'text/plain'}, method='POST')
        with urllib.request.urlopen(req) as response:
            pdb_data = response.read().decode('utf-8')
        
        # Save the PDB data
        with open(output_file, 'w') as f:
            f.write(pdb_data)
            
        print(f"Success! Protein structure saved to: {os.path.abspath(output_file)}")
        print("You can view this .pdb file using PyMOL, ChimeraX, or any online PDB viewer.")
        
    except urllib.error.URLError as e:
        print(f"Failed to fetch structure from ESMFold API: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fold a protein sequence using the ESMFold API.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("-s", "--sequence", type=str, help="The amino acid sequence to fold.")
    group.add_argument("-f", "--file", type=str, help="A text or FASTA file containing the sequence.")
    parser.add_argument("-o", "--output", type=str, default="output.pdb", help="Output PDB filename (default: output.pdb).")
    
    args = parser.parse_args()
    
    if args.file:
        try:
            with open(args.file, 'r') as f:
                # Basic parsing: ignore lines starting with '>' (FASTA headers)
                seq_lines = [line.strip() for line in f if not line.startswith('>')]
                sequence_input = ''.join(seq_lines)
        except Exception as e:
            print(f"Error reading file {args.file}: {e}")
            sys.exit(1)
    else:
        sequence_input = args.sequence
        
    fold_sequence(sequence_input, args.output)
