import React, { useEffect } from 'react';

const LanguageSelector: React.FC = () => {
  useEffect(() => {
    const addScript = () => {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
      document.body.appendChild(script);
    };

    if (!(window as any).googleTranslateElementInit) {
      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          'google_translate_element'
        );
      };
    }

    if (!document.getElementById('google-translate-script')) {
      addScript();
    }
  }, []);

  // Using 'notranslate' class to prevent the widget itself from being translated.
  return <div id="google_translate_element" className="notranslate"></div>;
};

export default LanguageSelector;
