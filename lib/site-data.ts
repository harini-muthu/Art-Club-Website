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
  imageUrl?: string | null;
};

export const clubName = "Purdue Art Community";

export const clubInitials = "PAC";

export const clubEmail = "purdueartcommunity@example.edu";

export const clubInstagramHandle = "@purdueartcommunity";

export const clubInstagramUrl = "https://www.instagram.com/purdueartcommunity/";

export const clubGroupMeUrl = "https://groupme.com/join_group/70944782/fyj62Zqd";

export const navItems: NavItem[] = [
  { label: "Events", href: "/" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" }
];
