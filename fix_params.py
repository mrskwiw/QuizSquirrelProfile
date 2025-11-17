#!/usr/bin/env python3
import re
import sys

def fix_route_file(filepath, param_name):
    """Fix Next.js 15 params in a route file"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if already has RouteParams interface
    if 'interface RouteParams' in content:
        print(f"  {filepath} - Already has RouteParams interface")
        return False

    # Add interface after imports
    import_section_end = content.rfind('\n', 0, content.find('\n\n'))
    if import_section_end == -1:
        import_section_end = content.find('\n\n')

    interface_code = f'''
interface RouteParams {{
  params: Promise<{{
    {param_name}: string
  }}>
}}
'''

    content = content[:import_section_end + 1] + interface_code + content[import_section_end + 1:]

    # Replace function signature patterns
    content = re.sub(
        rf'\{{\s*params\s*\}}:\s*\{{\s*params:\s*\{{\s*{param_name}:\s*string\s*\}}\s*\}}',
        '{ params }: RouteParams',
        content
    )

    # Add await params at start of each function
    lines = content.split('\n')
    new_lines = []
    in_function = False
    added_await = False

    for i, line in enumerate(lines):
        new_lines.append(line)

        # Detect function start
        if '{ params }: RouteParams' in line:
            in_function = True
            added_await = False

        # Add await after try {
        if in_function and not added_await and 'try {' in line:
            indent = len(line) - len(line.lstrip())
            new_lines.append(' ' * (indent + 2) + f'const {{ {param_name} }} = await params\n')
            added_await = True
            in_function = False

    content = '\n'.join(new_lines)

    # Replace params.id or params.username with just id or username
    content = re.sub(rf'params\.{param_name}', param_name, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  {filepath} - Fixed!")
    return True

# Fix the three remaining files
print("Fixing params for Next.js 15...")
files = [
    ('src/app/api/quiz/[id]/route.ts', 'id'),
    ('src/app/api/users/[username]/route.ts', 'username'),
    ('src/app/api/users/[username]/follow/route.ts', 'username'),
]

for filepath, param in files:
    fix_route_file(filepath, param)

print("\nDone!")
