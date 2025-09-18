#!/bin/bash

# Create an expect script to handle the interactive prompts
cat > /tmp/gluestack-init.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 30
spawn npx gluestack-ui@latest init --use-pnpm --path src/components/ui

# First prompt: Continue writing components in the above path?
expect "Yes / ○ No"
send "\r"

# Second prompt: Please select the framework you are using
expect "● Next Js"
send "\033\[B\r"  # Arrow down to select Expo, then Enter

# Wait for completion
expect eof
EOF

# Make the expect script executable and run it
chmod +x /tmp/gluestack-init.exp
expect /tmp/gluestack-init.exp

# Clean up
rm /tmp/gluestack-init.exp