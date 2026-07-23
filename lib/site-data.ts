export type NavItem = {
  label: string;
  href: string;
};

export type EventItem = {
  title: string;
  date: string;
  eventDate: string;
  time: string;
  location: string;
  description: string;
  imageTone: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  semester: string;
  status: "completed";
  featured?: boolean;
};

export type GalleryPhoto = {
  id: string;
  title: string;
  caption: string;
  artist: string;
  year: string;
  medium: string;
  dimensions: string;
  aspectRatio: string;
  statement: string;
  color: string;
};

export const clubName = "Studio Collective";

export const clubEmail = "studio.collective@example.edu";

export const navItems: NavItem[] = [
  { label: "Events", href: "/" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" }
];

export const events: EventItem[] = [
  {
    title: "Spring Showcase Night",
    date: "March 21",
    eventDate: "2026-03-21",
    time: "6:00 PM - 8:00 PM",
    location: "Student Union Atrium",
    description:
      "A casual gallery-and-performance night featuring student work, live demos, and open conversations with the club.",
    imageTone: "violet",
    semester: "Spring 2026",
    status: "completed",
    featured: true
  },
  {
    title: "Open Studio Night",
    date: "February 6",
    eventDate: "2026-02-06",
    time: "4:30 PM - 6:00 PM",
    location: "Arts Lab 204",
    description:
      "Members brought works in progress, swapped feedback, and made posters for the first gallery wall of the semester.",
    imageTone: "teal",
    semester: "Spring 2026",
    status: "completed"
  },
  {
    title: "Printmaking Workshop",
    date: "February 20",
    eventDate: "2026-02-20",
    time: "5:00 PM - 6:30 PM",
    location: "Media Room B",
    description:
      "A hands-on evening with relief prints, quick registration demos, and a shared drying rack full of member experiments.",
    imageTone: "rose",
    semester: "Spring 2026",
    status: "completed"
  },
  {
    title: "Critique Circle",
    date: "March 6",
    eventDate: "2026-03-06",
    time: "7:00 PM - 9:00 PM",
    location: "Studio Classroom",
    description:
      "A low-pressure group critique where members shared finished and unfinished pieces from this semester.",
    imageTone: "amber",
    semester: "Spring 2026",
    status: "completed"
  }
];

export const galleryPhotos: GalleryPhoto[] = [
  {
    id: "sunlit-figure",
    title: "Sunlit Figure",
    caption: "A warm portrait study exploring afternoon light and quiet confidence.",
    artist: "Mina Alvarez",
    year: "Class of 2027",
    medium: "Oil and acrylic on canvas",
    dimensions: "24 x 30 in.",
    aspectRatio: "4 / 5",
    statement:
      "I wanted the figure to feel caught between stillness and motion, like the second before someone turns toward a window.",
    color: "violet"
  },
  {
    id: "campus-after-rain",
    title: "Campus After Rain",
    caption: "Layered ink lines and translucent color capture the quad after a storm.",
    artist: "Theo Martin",
    year: "Class of 2026",
    medium: "Ink and watercolor",
    dimensions: "18 x 24 in.",
    aspectRatio: "3 / 4",
    statement:
      "This piece started as a location sketch and became a study of reflection, puddles, and the strange colors campus gets after rain.",
    color: "teal"
  },
  {
    id: "thread-map",
    title: "Thread Map",
    caption: "A fiber piece mapping friendships, commutes, and shared studio time.",
    artist: "Nia Brooks",
    year: "Class of 2025",
    medium: "Fiber, thread, and found paper",
    dimensions: "32 x 28 in.",
    aspectRatio: "8 / 7",
    statement:
      "Each stitched line represents a path someone in the club takes to get to the studio, layered into one shared map.",
    color: "amber"
  },
  {
    id: "blue-hour",
    title: "Blue Hour",
    caption: "A digital painting of campus windows just before night settles in.",
    artist: "Rae Kim",
    year: "Class of 2028",
    medium: "Digital painting",
    dimensions: "3600 x 4800 px",
    aspectRatio: "3 / 4",
    statement:
      "I focused on the little rectangles of light that make a big campus feel personal after dark.",
    color: "rose"
  },
  {
    id: "ceramic-orbit",
    title: "Ceramic Orbit",
    caption: "A hand-built vessel with carved rings and glazed constellations.",
    artist: "Amara Singh",
    year: "Class of 2026",
    medium: "Stoneware and glaze",
    dimensions: "12 x 12 x 15 in.",
    aspectRatio: "1 / 1",
    statement:
      "The surface is carved like a sketchbook, but the form is meant to feel planetary and solid.",
    color: "indigo"
  },
  {
    id: "zine-table",
    title: "Zine Table",
    caption: "A risograph-style spread about club notes, flyers, and marginalia.",
    artist: "Leo Chen",
    year: "Class of 2027",
    medium: "Digital collage and print layout",
    dimensions: "11 x 17 in.",
    aspectRatio: "11 / 17",
    statement:
      "I collected scraps from meetings and turned them into a fake archive of how clubs actually remember things.",
    color: "green"
  },
  {
    id: "soft-geometry",
    title: "Soft Geometry",
    caption: "Charcoal forms that bend architectural shapes into something softer.",
    artist: "Jules Carter",
    year: "Class of 2025",
    medium: "Charcoal on toned paper",
    dimensions: "20 x 26 in.",
    aspectRatio: "10 / 13",
    statement:
      "I was thinking about the difference between buildings as designed spaces and buildings as lived-in spaces.",
    color: "orange"
  },
  {
    id: "sound-in-pink",
    title: "Sound in Pink",
    caption: "An abstract acrylic piece based on a student jazz rehearsal.",
    artist: "Elena Park",
    year: "Class of 2028",
    medium: "Acrylic and pastel",
    dimensions: "30 x 40 in.",
    aspectRatio: "3 / 4",
    statement:
      "The marks follow rhythm more than image; I painted from the feeling of the rehearsal rather than a photo of it.",
    color: "cyan"
  }
];
