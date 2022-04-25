export const typeDef = `
type Draft_Language {
  """
  Language as displayable text
  """
  display: String!

  """
  ISO639-2 language code
  """
  isoCode: String!
}
type Draft_MaterialTypes {
  """
  The general type of material of the manifestation based on a grouping of bibliotek.dk material types, e.g. bøger, lydbøger etc. 
  """
  general: [String!]!

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  specific: [String!]!
}
type Draft_FictionNonfiction {
  """
  Displayable overall category/genre
  """
  display: String!

  """
  Binary code fiction/nonfiction used for filtering
  """
  code: String!
}
type Draft_DK5MainEntry {
  """
  Displayable main DK5 classification
  """
  display: String!

  """
  Main DK5 classification code
  """
  code: String!
}
type Draft_Work {
  """
  Unique identification of the work based on work-presentation id e.g work-of:870970-basis:54029519
  """
  workId: String!
  
  titles: Draft_WorkTitles!

  """
  Abstract of the entity
  """
  abstract: [String!]

  """
  Creators
  """
  creators: [Draft_Creator!]!

  """
  DK5 main entry for this work
  """
  dk5MainEntry: Draft_DK5MainEntry

  """
  Overall literary category/genre of this work. e.g. fiction or nonfiction. In Danish skønlitteratur/faglitteratur for literature, fiktion/nonfiktion for other types.
  """
  fictionNonfiction: Draft_FictionNonfiction

  """
  The type of material of the manifestation based on bibliotek.dk types
  """
  materialTypes: Draft_MaterialTypes!

  """
  Series for this work
  """
  series: Draft_SeriesContainer

  """
  Literary/movie universe this work is part of, e.g. Wizarding World, Marvel Universe
  """
  universe: Draft_Universe

  """
  Subjects for this work
  """
  subjects: Draft_SubjectContainer!

  """
  The genre, (literary) form, type etc. of this work
  """
  genreAndForm: [String!]!

  """
  Worktypes for this work - 'none' replaced by 'other'
  """
  workTypes: [Draft_WorkType!]!

  """
  The year this work was originally published or produced
  """
  workYear: String

  """
  The main language(s) of the work's content
  """
  mainLanguages: [Draft_Language!]!

  """
  Details about the manifestations of this work
  """
  manifestations: Draft_Manifestations!
}
enum Draft_WorkType {
  analysis
  article
  bookdescription
  game
  literature
  map
  movie
  music
  other
  periodica
  portrait
  review
  sheetmusic
  track
}
type Draft_WorkTitles {
  """
  The main title(s) of the work
  """
  main: [String!]!

  """
  The full title(s) of the work including subtitles etc
  """
  full: [String!]!

  """
  Titles (in other languages) parallel to the main 'title' of the work
  """
  parallel: [String!]!

  """
  The sorted title of the entity
  """
  sort: String!

  """
  The title of the work that this expression/manifestation is translated from or based on. The original title(s) of a film which has added distribution titles in marc field 239 and 739
  """
  original: [String!]

  """
  The standard title of the entity, used for music and movies
  """
  standard: String

  """
  Danish translation of the main title
  """
  translated: [String!]
}
`;

const FAKE_GENERAL_SERIES = {
  title: "Some Series",
  parallelTitles: [
    "Some Series, parallel title",
    "Some Series, another parallel title",
  ],
  numberInSeries: {
    display: "number one",
    number: 1,
  },
  works: [],
};

const FAKE_SERIES_CONTAINER = {
  all: [FAKE_GENERAL_SERIES],
  popular: [
    {
      title: "Some Series",
      alternativeTitles: [
        "Some Series, parallel title",
        "Some Series, another parallel title",
      ],
      numberInSeries: {
        display: "number one",
        number: 1,
      },
      readThisFirst: true,
      readThisWhenever: false,
      works: [],
    },
  ],
};
const FAKE_PERSON = {
  __typename: "Draft_Person",
  display: "Jens Jensen",
  nameSort: "Jensen Jens",
  firstName: "Jens",
  lastName: "Jensen",
  birthYear: "1950",
  romanNumeral: "Jens Jensen IV",
  attributeToName: "Jens Jensen, testperson",
  aliases: [
    { display: "Svend Svendsen, personen bag Jens Jensen" },
    { display: "Kirsten Kirstensen, personen bag Jens Jensen" },
  ],
  roles: [
    {
      functionCode: "aut",
      function: {
        singular: "forfatter",
        plural: "forfattere",
      },
    },
  ],
};

const FAKE_CORPORATION = {
  __typename: "Draft_Corporation",
  display: "Some Corporation",
  nameSort: "Some Corporation for sorting",
  main: "Some Corporation",
  sub: "Some Sub Corporation",
  location: "Some location",
  year: "1950",
  number: "5",
  attributeToName: "Some Corporation ...",
  roles: [],
};

const FAKE_SUBJECTS = {
  all: [
    {
      __typename: "Draft_SubjectText",
      type: "DBC_FICTION",
      display: "Some fictional subject",
    },
    {
      __typename: "Draft_TimePeriod",
      display: "1950-1980",
      period: { begin: 1950, end: 1980, display: "1950-1980" },
    },
    FAKE_PERSON,
    FAKE_CORPORATION,
  ],
  dbcVerified: [
    {
      __typename: "Draft_SubjectText",
      type: "DBC_FICTION",
      display: "Some fictional subject",
    },
    {
      __typename: "Draft_TimePeriod",
      display: "1950-1980",
      period: { begin: 1950, end: 1980, display: "1950-1980" },
    },
    FAKE_PERSON,
    FAKE_CORPORATION,
  ],
};

const FAKE_MANIFESTATION_1 = {
  pid: "some-pid-1",
  titles: {
    main: ["Some Title"],
    full: ["Some Title: Full"],
    alternative: ["Some Title: Alternative"],
    identifyingAddition: "Indlæst af Jens Jensen",
    original: ["Some Title: Original"],
    parallel: ["Parallel Title 1", "Parallel Title 2"],
    sort: "Some Title Sort",
    standard: "Some Title Standard",
    translated: ["En Oversat Titel"],
  },
  abstract: ["Some abstract ..."],
  accessTypes: ["fysisk", "online"],
  access: [
    {
      __typename: "Draft_URL",
      origin: "DBC Webarkiv",
      url: "https://moreinfo.dbc.dk",
    },
    {
      __typename: "Draft_Ereol",
      origin: "Ereolen",
      url: "https://...",
      canAlwaysBeLoaned: true,
    },
    {
      __typename: "Draft_Ill",
      ill: true,
    },
    {
      __typename: "Draft_InfomediaService",
      id: "123456",
    },
    {
      __typename: "Draft_DigitalArticleService",
      issn: "123456",
    },
  ],
  audience: {
    generalAudience: ["general audience"],
    ages: [{ display: "10-14", begin: 10, end: 14 }],
    libraryRecommendation: "some library recommendation",
    childrenOrAdults: ["til børn"],
    schoolUse: ["til skolebrug"],
    primaryTarget: ["Some primary target"],
    let: "some let",
    lix: "some lix",
  },
  contributors: [
    {
      ...FAKE_PERSON,
      roles: [
        {
          functionCode: "ill",
          function: {
            singular: "illustrator",
            plural: "illustratorer",
          },
        },
      ],
    },
  ],
  contributorsFromDescription: ["på dansk ved Vivi Berendt"],
  creators: [FAKE_PERSON, FAKE_CORPORATION],
  creatorsFromDescription: ["tekst af William Warren"],
  classifications: [
    {
      system: "DK5",
      code: "86-096",
      display: "Skønlitteratur",
      entryType: "NATIONAL_BIBLIOGRAPHY_ENTRY",
    },
  ],
  edition: {
    summary: "3. i.e. 2 udgave, 2005",
    edition: "3. i.e. 2 udgave",
    contributors: [],
    publicationYear: {
      display: "2005",
      number: 2005,
    },
  },
  latestPrinting: {
    summary: "11. oplag, 2020",
    printing: "11. oplag",
    publicationYear: {
      display: "2020",
      number: 2020,
    },
  },
  fictionNonfiction: { display: "skønlitteratur", code: "fiction" },
  genreAndForm: ["some genre"],
  hostPublication: {
    title: "Årsskrift / Carlsbergfondet",
    creator: "Some Creator",
    isbn: "some isbn",
    issue: "some issue",
    notes: ["a note"],
    pages: "140-145",
    publisher: "Some Publisher",
    summary: "Årsskrift / Carlsbergfondet, 2006",
    issn: "1395-7961",
    year: {
      display: "2006",
      number: 2006,
    },
    series: FAKE_GENERAL_SERIES,
  },
  identifiers: [
    {
      type: "isbn",
      value: "1234567891234",
    },
  ],
  languages: {
    main: [{ display: "dansk", isoCode: "dan" }],
    original: [{ display: "dansk", isoCode: "dan" }],
    parallel: [{ display: "dansk", isoCode: "dan" }],
    spoken: [{ display: "dansk", isoCode: "dan" }],
    subtitles: [{ display: "dansk", isoCode: "dan" }],
    abstract: [{ display: "dansk", isoCode: "dan" }],
  },
  manifestationParts: {
    type: "MUSIC_TRACKS",
    heading: "Indhold:",
    parts: [
      {
        title: "Bouquet royal",
        creators: [
          {
            __typename: "Draft_Person",
            display: "H. C. Lumbye",
            nameSort: "Lumbye, H.C.",
            firstName: "H. C.",
            lastName: "Lumbye",
            roles: [],
          },
        ],
        creatorsFromDescription: ["arr.: Peter Ettrup Larsen"],
        classifications: [
          {
            system: "DK5",
            code: "78.424",
            display: "Klaver og strygere. Orgel og strygere",
          },
        ],
      },
    ],
  },
  materialTypes: { general: ["bøger", "ebøger"], specific: ["bog", "ebog"] },
  notes: [
    {
      type: "NOT_SPECIFIED",
      display: ["Indspillet i Ꜳrhus Musikhus 12.-14. juni 2020"],
    },
  ],
  relatedPublications: [
    {
      heading: "Tidligere titel:",
      title: ["Yngre læger"],
      issn: "0105-0508",
    },
    {
      heading: "Udgave i andet medium: Også på cd-rom",
      title: ["Ugeskrift for læger"],
      issn: "1399-4174",
    },
  ],
  physicalDescriptions: [
    {
      summary:
        "1 dvd-rom Xbox One Nødvendigt udstyr Xbox One. - Med multiplayerfunktion Spiludvikler fremgår ikke af materialet",
      extent: "1 dvd-rom",
      requirements: "Nødvendigt udstyr Xbox One. - Med multiplayerfunktion",
      technicalInformation: "Xbox One",
    },
  ],
  publicationYear: {
    display: "1839",
    year: 1839,
    frequency: "ugentlig",
  },
  publisher: ["Lægeforeningen"],
  recordCreationDate: "19830414",
  series: FAKE_SERIES_CONTAINER,
  shelfmark: {
    prefix: "some prefix",
    shelfmark: "some shelfmark",
  },
  source: "some source",
  subjects: FAKE_SUBJECTS,
  volume: "Bind 2",
  tableOfContents: {
    heading: "Indhold",
    listOfContent: [
      {
        heading: "Puderne",
        listOfContent: [{ heading: "Bruddet" }, { heading: "Hustelefonen" }],
      },
      {
        heading: "Tykke-Olsen m.fl.",
      },
      {
        heading: "Over skulderen",
      },
    ],
  },
};

const FAKE_MANIFESTATION_2 = {
  ...FAKE_MANIFESTATION_1,
  pid: "some-pid-2",
};

export const resolvers = {
  Draft_Work: {
    workId(parent, args, context) {
      return "work-of:870970-basis:54029519";
    },
    titles(parent, args, context) {
      return {
        main: ["Some Title"],
        full: ["Some Title: Full"],
        parallel: ["Parallel Title 1", "Parallel Title 2"],
        sort: "Some Title Sort",
        original: ["Some Title Origintal"],
        standard: "Some Title Standard",
        translated: ["Oversat titel"],
      };
    },
    abstract() {
      return ["The abstract"];
    },
    creators() {
      return [FAKE_PERSON, FAKE_CORPORATION];
    },
    dk5MainEntry() {
      return { display: "some dk5 display", code: "some dk5 code" };
    },
    fictionNonfiction() {
      return { display: "skønlitteratur", code: "fiction" };
    },
    materialTypes() {
      return { general: ["bøger", "ebøger"], specific: ["bog", "ebog"] };
    },
    series() {
      return FAKE_SERIES_CONTAINER;
    },
    universe() {
      return { title: "Some Universe" };
    },
    subjects() {
      return FAKE_SUBJECTS;
    },
    genreAndForm() {
      return ["some genre"];
    },
    workTypes() {
      return ["literature"];
    },
    workYear() {
      return "1950";
    },
    mainLanguages() {
      return [{ display: "dansk", isoCode: "dan" }];
    },
    manifestations() {
      return {
        first: FAKE_MANIFESTATION_1,
        latest: FAKE_MANIFESTATION_2,
        all: [FAKE_MANIFESTATION_1, FAKE_MANIFESTATION_2],
      };
    },
  },
};
