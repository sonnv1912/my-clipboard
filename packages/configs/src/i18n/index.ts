import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import usCommon from './us/common.json';
import usMe from './us/me.json';

// import vnCommon from './vn/common.json';
// import vnMe from './vn/me.json';

const languages: Record<
   string,
   {
      label: string;
      code: string;
   }
> = {
   us: {
      label: 'English',
      code: 'us',
   },
   //    vn: {
   //       label: 'Tiếng Việt',
   //       code: 'vn',
   //    },
};

const getLanguage = () => {
   const language = localStorage.getItem('i18nextLng');

   if (
      language &&
      Object.keys(languages)
         .map((t) => t)
         .includes(language)
   ) {
      return language;
   }

   return languages.us.code;
};

i18n.use(initReactI18next).init({
   fallbackLng: languages.us.code,
   lng: getLanguage(),
   interpolation: {
      escapeValue: false,
   },
   resources: {
      us: {
         me: usMe,
         common: usCommon,
      },
      //   vn: {
      //      me: vnMe,
      //      common: vnCommon,
      //   },
   },
});

export { languages, i18n };
