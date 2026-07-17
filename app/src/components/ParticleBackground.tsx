import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

export const ParticleBackground = () => {
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const isDark = theme === 'dark';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: transparent;
    }
    #tsparticles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/tsparticles-slim@2.12.0/tsparticles.slim.bundle.min.js"></script>
</head>
<body>
  <div id="tsparticles"></div>
  <script>
    function initParticles(isDarkStr) {
      const isDark = isDarkStr === 'true';
      tsParticles.load("tsparticles", {
        background: { color: { value: "transparent" } },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: { enable: true, mode: "push" },
            onHover: { enable: true, mode: "grab" },
          },
          modes: {
            push: { quantity: 4 },
            grab: {
              distance: 140,
              links: { opacity: 0.8, color: isDark ? "#3b82f6" : "#2563eb" },
            },
          },
        },
        particles: {
          color: { value: isDark ? "#ffffff" : "#1e40af" },
          links: {
            color: isDark ? "#60a5fa" : "#3b82f6",
            distance: 150,
            enable: true,
            opacity: isDark ? 0.4 : 0.3,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: { default: "bounce" },
            random: false,
            speed: 1,
            straight: false,
          },
          number: { density: { enable: true }, value: 80 },
          opacity: { value: isDark ? 0.5 : 0.3 },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 3 } },
        },
        detectRetina: true,
      });
    }
    
    // Listen for theme changes from React Native
    document.addEventListener("message", function(event) {
      if (event.data.startsWith("THEME:")) {
        const theme = event.data.split(":")[1];
        initParticles(theme === 'dark' ? 'true' : 'false');
      }
    });
  </script>
</body>
</html>
  `;

  // Update theme when it changes
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(`THEME:${theme}`);
    }
  }, [theme]);

  const handleMessage = (event: any) => {
    // console.log('Message from WebView:', event.nativeEvent.data);
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={handleMessage}
        injectedJavaScript={`initParticles('${isDark ? 'true' : 'false'}'); true;`}
        pointerEvents="none"
      />
    </View>
  );
};
