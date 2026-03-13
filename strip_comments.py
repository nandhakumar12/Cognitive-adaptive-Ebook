import os
import re

# Regex to match single line comments that start with //
# It tries to avoid matching // inside URLs like http://
# A more robust regex requires more context, but a common heuristic:
# Match // only if it's preceded by whitespace, start of line, or a specific character that isn't a colon.
# Actually, a simple approach: find lines containing //, if it's part of a URL, keep it.
# If it's a comment, remove it. 
# We should avoid removing // inside quotes, but for a quick script, a basic regex might suffice if we are careful.

# Pattern: 
# ^\s*//.*$ (whole line comment)
# \s+//.*$ (end of line comment, requiring at least one space before // to avoid URLs mostly, though http:// usually doesn't have a space before it anyway)

def is_url(text):
    return "http://" in text or "https://" in text

def strip_comments(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    modified = False
    
    for line in lines:
        original = line
        
        # Fast path
        if "//" not in line:
            new_lines.append(line)
            continue
            
        # If it contains a URL, let's be very safe and just keep the line as is
        # unless we want to be fancy. For safety in a bulk run, skip lines with http://
        if "http://" in line or "https://" in line:
            new_lines.append(line)
            continue
            
        # Match whole line comment
        if re.match(r'^\s*//.*$', line):
            modified = True
            continue # drop the line
            
        # Match end of line comment (needs at least one space before // to avoid messing up strings like "path//to")
        # Let's use a regex that matches ` //` followed by anything, but not inside quotes.
        # Doing full JS parser in regex is hard. Let's just match ` //.*$` and replace with empty string if found.
        # This might break if ` "string // value" ` exists, but it's rare.
        
        # We can split by // and check if it looks like a comment.
        parts = line.split('//')
        if len(parts) > 1:
            # Check if it was preceded by a space or tab, or is at the very beginning
            idx = line.find('//')
            if idx == 0 or line[idx-1] in ' \t;}':
                # It's likely a comment
                new_line = line[:idx].rstrip() + '\n'
                if new_line.strip() == '':
                    # became empty line, just drop it if it was purely a comment line
                    # but if it originally had indentation we might want to keep the empty line or drop it.
                    # let's just drop it
                    modified = True
                    continue
                else:
                    new_lines.append(new_line)
                    modified = True
                    continue
                    
        new_lines.append(line)
        
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)

def process_dir(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or 'dist' in root or 'build' in root or 'coverage' in root:
            continue
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                strip_comments(os.path.join(root, file))

if __name__ == "__main__":
    print("Processing frontend...")
    process_dir("C:\\Users\\nandh\\Desktop\\adaptive cognitive\\frontend")
    print("Processing backend...")
    process_dir("C:\\Users\\nandh\\Desktop\\adaptive cognitive\\backend")
    print("Done.")
