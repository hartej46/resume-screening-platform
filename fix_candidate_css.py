import re

with open('src/components/candidate/candidate.css', 'r') as f:
    content = f.read()

# Replace hardcoded colors that should be theme-aware
# We target 'white' specifically as it was used for text in dark mode but should be dark in light mode.
# We avoid replacing white in backgrounds where it might be intentional (e.g. simulation transcript)

# Replace 'color: white;' and variants
content = re.sub(r'color:\s*white(\s*!important)?\s*;', 'color: var(--text-main)\\1;', content)
content = re.sub(r'color:\s*#ffffff(\s*!important)?\s*;', 'color: var(--text-main)\\1;', content)
content = re.sub(r'color:\s*rgba?\(255,\s*255,\s*255(,\s*1)?\)(\s*!important)?\s*;', 'color: var(--text-main)\\2;', content)

# Also handle some specific background colors that should probably be cards
# but be careful with transparent whites.

with open('src/components/candidate/candidate.css', 'w') as f:
    f.write(content)

print("Applied theme-aware color variables to candidate.css")
