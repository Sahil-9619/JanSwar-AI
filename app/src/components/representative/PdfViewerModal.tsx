import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, Download, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface PdfViewerModalProps {
  visible: boolean;
  docUrl: string | null;
  onClose: () => void;
}

/**
 * In-app PDF / Document viewer using Google Docs Viewer inside a WebView.
 * Falls back to a raw URL load if Google Docs viewer fails.
 */
export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  visible,
  docUrl,
  onClose,
}) => {
  const { theme, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useRawUrl, setUseRawUrl] = useState(false);

  if (!docUrl) return null;

  // Force HTTPS for Android cleartext traffic rules
  const secureUrl = docUrl.replace('http://', 'https://');
  
  // Use Google Docs for the external link so Android opens it in Chrome instead of crashing looking for a PDF app
  const externalUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(secureUrl)}`;

  // Generate HTML for an embedded PDF.js viewer that renders directly in the WebView
  const pdfJsHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: ${colors.background}; display: flex; flex-direction: column; align-items: center; }
        canvas { max-width: 100%; border-bottom: 5px solid ${colors.cardBorder}; margin-bottom: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        #loading { margin-top: 50px; font-family: sans-serif; color: ${colors.mutedForeground}; font-weight: bold; }
      </style>
    </head>
    <body>
      <div id="loading">Loading PDF Pages...</div>
      <div id="pdf-container"></div>
      <script>
        var url = '${secureUrl}';
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        pdfjsLib.getDocument(url).promise.then(function(pdf) {
          document.getElementById('loading').style.display = 'none';
          var container = document.getElementById('pdf-container');
          
          for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            pdf.getPage(pageNum).then(function(page) {
              var scale = 1.5; // Adjust scale for better resolution on mobile
              var viewport = page.getViewport({scale: scale});
              var canvas = document.createElement('canvas');
              var ctx = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              container.appendChild(canvas);
              
              var renderContext = { canvasContext: ctx, viewport: viewport };
              page.render(renderContext);
            });
          }
        }).catch(function(err) {
          console.error(err);
          document.getElementById('loading').innerText = 'Failed to load PDF preview. Tap the download icon above to open externally.';
          document.getElementById('loading').style.color = '#ef4444';
        });
      </script>
    </body>
    </html>
  `;

  const handleClose = () => {
    setIsLoading(true);
    setHasError(false);
    setUseRawUrl(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await Linking.openURL(externalUrl);
                } catch (e) {
                  Alert.alert('Error', 'Could not open browser to view document.');
                }
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: colors.primary + '18',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
                borderWidth: 1,
                borderColor: colors.primary + '35',
              }}
            >
              <Download size={16} color={colors.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '900',
                  color: colors.foreground,
                }}
                numberOfLines={1}
              >
                Supporting Document
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: colors.mutedForeground,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                PDF / Document Viewer
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleClose}
            style={{
              padding: 10,
              borderRadius: 20,
              backgroundColor:
                theme === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.05)',
            }}
          >
            <X size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Error state */}
        {hasError && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              marginHorizontal: 16,
              marginTop: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.25)',
            }}
          >
            <AlertCircle size={14} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '700', flex: 1 }}>
              Preview failed. Tap the download icon to open externally.
            </Text>
          </View>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <View
            style={{
              position: 'absolute',
              top: 80,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
              backgroundColor: colors.background,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                marginTop: 14,
                fontSize: 12,
                fontWeight: '700',
                color: colors.mutedForeground,
              }}
            >
              Loading document…
            </Text>
          </View>
        )}

        {/* WebView */}
        <WebView
          key={secureUrl}
          originWhitelist={['*']}
          source={{ html: pdfJsHtml }}
          style={{ flex: 1, backgroundColor: colors.background }}
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 400) {
              setIsLoading(false);
              setHasError(true);
            }
          }}
          allowsInlineMediaPlayback
          startInLoadingState={false}
          scalesPageToFit
          javaScriptEnabled
          domStorageEnabled
        />
      </SafeAreaView>
    </Modal>
  );
};
