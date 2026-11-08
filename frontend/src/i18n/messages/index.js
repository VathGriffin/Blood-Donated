// Every translation namespace. A key is "namespace.path", e.g. t('nav.home').
// Each namespace file holds English, Khmer and Vietnamese side by side so they are reviewed
// together; i18n/messages.test.js fails if any language is missing a key the others have.
import common from './common';
import nav from './nav';
import layout from './layout';
import search from './search';
import home from './home';
import donate from './donate';
import about from './about';
import contact from './contact';
import assistant from './assistant';
import booking from './booking';
import map from './map';
import ui from './ui';
import directory from './directory';
import auth from './auth';
import server from './server';
import legal from './legal';
import status from './status';
import donor from './donor';
import hosp from './hosp';
import shared from './shared';
import adm from './adm';
import titles from './titles';
import feed from './feed';
import aiChat from './aiChat';

const MESSAGES = { common, nav, layout, search, home, donate, about, contact, assistant, booking, map, ui, directory, auth, server, legal, status, donor, hosp, shared, adm, titles, feed, aiChat };

export default MESSAGES;
