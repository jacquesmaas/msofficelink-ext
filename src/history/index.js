import '../assets/css/element-ui.scss';
import App from './root';
import ElementUI from 'element-ui';
import Vue from 'vue';
import localeEN from 'element-ui/lib/locale/lang/en';
import localeDE from 'element-ui/lib/locale/lang/de';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faEdit,
  faGlobe,
  faGlasses,
  faDownload,
  faFolderOpen,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faEdit, faGlobe, faGlasses, faDownload, faFolderOpen, faFileAlt);

Vue.component(FontAwesomeIcon.name, FontAwesomeIcon);

Vue.config.productionTip = false;

const currentLocale = chrome.i18n.getUILanguage();
const locale = currentLocale === 'de' ? localeDE : localeEN;

Vue.use(ElementUI, { locale });

/* eslint-disable no-new */
new Vue({
  el: '#root',
  render: h => h(App)
});
