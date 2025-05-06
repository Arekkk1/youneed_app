import { people01, people02, people03, facebook, instagram, linkedin, twitter, send, shield, star  } from "../assets";
// Removed airbnb, binance, coinbase, dropbox from imports as they were PNGs

// Use logoSvg for icons previously represented by PNGs
import logoSvg from '../assets/icon/Logo.svg';

export const eventArray = [
  {
    id: '1',
    name: 'Nowe zadanie',
    startAt: new Date('2024-03-27T09:00:00'),
    endAt: new Date('2024-03-27T10:00:00'),
    timeLine: 'w-1/2',
    togglePullDown: false,
    hidden: '',
    spaceName: 'Warszawa',
    persons:{
      user: {
        id: 1,
        userName: 'Monika',
        img: people01, // Keep using people01 for now
      },
      // Removed duplicate user entries, assuming it should be an array or different structure
    }
  },
  // Add more events if needed
];

export const subscriptionArray = [
  {
    id: '1',
    name: 'PHPSTORM',
    price: 'Trial',
    startAt: new Date('2024-03-27T09:00:00'),
    endAt: new Date('2024-04-27T10:00:00'),
    endAtString: 'Kwi', // Abbreviated month
    timeLine: 'w-1/2',
    togglePullDown: false,
    hidden: '',
    spaceName: 'Warszawa',
    img: logoSvg, // Use SVG logo
  },
  {
    id: '2',
    name: 'Jira',
    price: '$30',
    endAtString: 'Maj', // Abbreviated month
    startAt: new Date('2024-03-27T09:00:00'),
    endAt: new Date('2024-05-17T10:00:00'),
    timeLine: 'w-1/2',
    togglePullDown: false,
    hidden: '',
    spaceName: 'Warszawa',
    img: logoSvg, // Use SVG logo
  },
  {
    id: '3',
    name: 'Microsoft 360',
    price: '$56',
    startAt: new Date('2024-03-27T09:00:00'),
    endAt: new Date('2024-04-18T10:00:00'),
    endAtString: 'Kwi', // Abbreviated month
    timeLine: 'w-1/2',
    togglePullDown: false,
    hidden: '',
    spaceName: 'Warszawa',
    img: logoSvg, // Use SVG logo
  },
  {
    id: '4',
    name: 'T-Mobile',
    price: 'Trial',
    startAt: new Date('2024-03-27T09:00:00'),
    endAt: new Date('2024-05-27T10:00:00'),
    endAtString: 'Maj', // Abbreviated month
    timeLine: 'w-1/2',
    togglePullDown: false,
    hidden: '',
    spaceName: 'Warszawa',
    img: logoSvg, // Use SVG logo
  },
  {
    id: '5',
    name: 'Youtube Premium',
    price: 'Trial',
    startAt: new Date('2024-03-27T09:00:00'),
    endAt: new Date('2024-04-27T10:00:00'),
    endAtString: 'Kwi', // Abbreviated month
    timeLine: 'w-1/2',
    togglePullDown: false,
    hidden: '',
    spaceName: 'Warszawa',
    img: logoSvg, // Use SVG logo
  },
];

// timeArray seems like old data, commenting out for now unless needed
/*
const timeArray = [
  // ... original timeArray data ...
]
*/

export const feedback = [
  {
    id: "feedback-1",
    headerTitle: "Kiełbasa",
    content:
      "Zarobić kase i na dobrą kiełbase. Zjeść i napić się czegoś po robocie",
    name: "Monika.",
    title: "Founder & Leader",
    img: people01, // Keep using people01 for now
    day: 2,
    date: '.03.2024'
  },
  {
    id: "feedback-2",
    headerTitle: "Fiat 126p",
    content:
      "Sprzedać malucha Fiat 126p 1886 rok, cena wyceny to 20 tys zł.",
    name: "Arek",
    surname: "Wiktorowicz",
    title: "Founder & Leader",
    img: people02, // Keep using people02 for now
    day: 5,
    date: '.03.2024'
  },
  {
    id: "feedback-3",
    headerTitle: "Money",
    content:
      "It is usually people in the money business, finance, and international trade that are really rich.",
    name: "Mateusz",
    surname: "Martyniuk",
    title: "Founder & Leader",
    img: people03, // Keep using people03 for now
    day: 5,
    date: '.03.2024'
  },
  // Add more feedback items if needed, using people images or replace with logoSvg
];


export const footerLinks = [
  {
    title: "Useful Links",
    links: [
      {
        name: "Content",
        link: "#", // Use # for placeholder links
      },
      {
        name: "How it Works",
        link: "#",
      },
      {
        name: "Create",
        link: "#",
      },
      {
        name: "Explore",
        link: "#",
      },
      {
        name: "Terms & Services",
        link: "#",
      },
    ],
  },
  {
    title: "Community",
    links: [
      {
        name: "Help Center",
        link: "#",
      },
      {
        name: "Partners",
        link: "#",
      },
      {
        name: "Suggestions",
        link: "#",
      },
      {
        name: "Blog",
        link: "#",
      },
      {
        name: "Newsletters",
        link: "#",
      },
    ],
  },
  {
    title: "Partner",
    links: [
      {
        name: "Our Partner",
        link: "#",
      },
      {
        name: "Become a Partner",
        link: "#",
      },
    ],
  },
];

export const socialMedia = [
  {
    id: "social-media-1",
    icon: instagram, // Keep SVG
    link: "https://www.instagram.com/",
  },
  {
    id: "social-media-2",
    icon: facebook, // Keep SVG
    link: "https://www.facebook.com/",
  },
  {
    id: "social-media-3",
    icon: twitter, // Keep SVG
    link: "https://www.twitter.com/",
  },
  {
    id: "social-media-4",
    icon: linkedin, // Keep SVG
    link: "https://www.linkedin.com/",
  },
];

export const clients = [ // Renamed to modules or similar might be better
  {
    id: "module-1",
    logo: logoSvg, // Use SVG logo
    name: 'Tasks & Events',
    link: '/provider/calendar' // Link to provider calendar
  },
  {
    id: "module-2",
    logo: logoSvg, // Use SVG logo
    name: 'Files',
    link: '/provider/dashboard/files' // Example path, adjust as needed

  },
  {
    id: "module-3",
    logo: logoSvg, // Use SVG logo
    name: 'Subscription',
    link: '/provider/dashboard/subscriptions' // Example path, adjust as needed

  },
  {
    id: "module-4",
    logo: logoSvg, // Use SVG logo
    name: 'New File',
    link: '/provider/dashboard/new-file' // Example path, adjust as needed

  },
];
