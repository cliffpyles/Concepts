export interface CodePenUser {
  username: string;
  nicename?: string;
  avatar?: string;
}

export interface CodePenImages {
  small?: string;
  large?: string;
}

export interface Pen {
  id: string;
  title: string;
  details: string;
  link: string;
  views?: string;
  loves?: string;
  comments?: string;
  images?: CodePenImages;
  user?: CodePenUser;
  /** When this pen was first added to our log (from sync) */
  firstSeen?: string;
}

export interface PensData {
  pens: Pen[];
  lastSynced: string | null;
  username: string;
}
