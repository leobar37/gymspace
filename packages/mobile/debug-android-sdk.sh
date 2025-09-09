#!/bin/bash

echo "=== Android SDK Debug Information ==="
echo "Date: $(date)"
echo "User: $(whoami)"
echo "PWD: $(pwd)"
echo ""

echo "=== Environment Variables ==="
echo "ANDROID_HOME: ${ANDROID_HOME:-NOT SET}"
echo "ANDROID_SDK_ROOT: ${ANDROID_SDK_ROOT:-NOT SET}"
echo "PATH includes SDK: $(echo $PATH | grep -c android || echo 'NO')"
echo ""

echo "=== SDK Directory Check ==="
if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
    echo "✅ ANDROID_HOME directory exists: $ANDROID_HOME"
    echo "Directory contents:"
    ls -la "$ANDROID_HOME" | head -10
    echo ""
    
    echo "=== Critical SDK Components ==="
    echo "📱 platforms:"
    ls "$ANDROID_HOME/platforms" 2>/dev/null || echo "❌ platforms directory missing"
    echo ""
    
    echo "🔧 build-tools:"
    ls "$ANDROID_HOME/build-tools" 2>/dev/null || echo "❌ build-tools directory missing"
    echo ""
    
    echo "⚡ platform-tools:"
    ls "$ANDROID_HOME/platform-tools/adb" >/dev/null 2>&1 && echo "✅ adb found" || echo "❌ adb missing"
    echo ""
    
    echo "💻 cmdline-tools:"
    ls "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" >/dev/null 2>&1 && echo "✅ sdkmanager found" || echo "❌ sdkmanager missing"
    echo ""
else
    echo "❌ ANDROID_HOME not set or directory doesn't exist"
fi

echo "=== local.properties Check ==="
LOCAL_PROPS="./android/local.properties"
if [ -f "$LOCAL_PROPS" ]; then
    echo "✅ local.properties exists"
    echo "Contents:"
    cat "$LOCAL_PROPS"
else
    echo "❌ local.properties missing at: $LOCAL_PROPS"
fi
echo ""

echo "=== Gradle Wrapper Check ==="
if [ -f "./android/gradlew" ]; then
    echo "✅ gradlew exists"
    echo "Permissions: $(ls -la ./android/gradlew | awk '{print $1}')"
else
    echo "❌ gradlew missing"
fi
echo ""

echo "=== Java/JDK Check ==="
echo "JAVA_HOME: ${JAVA_HOME:-NOT SET}"
java -version 2>&1 | head -3
echo ""

echo "=== EAS Configuration ==="
echo "eas.json exists: $([ -f ../../eas.json ] && echo 'YES' || echo 'NO')"
if [ -f "../../eas.json" ]; then
    echo "Android env configuration:"
    grep -A 10 -B 2 "ANDROID_HOME" ../../eas.json || echo "No ANDROID_HOME found in eas.json"
fi
echo ""

echo "=== Test SDK Access ==="
if [ -n "$ANDROID_HOME" ]; then
    echo "Testing SDK manager access..."
    "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --version 2>&1 || echo "❌ Cannot run sdkmanager"
fi

echo "=== Debug Complete ==="