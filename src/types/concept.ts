export type Platform = "CodePen" | "Sandbox" | "GitHub" | "Colab";

export interface ConceptMetrics {
    views?: number;
    loves?: number;
    comments?: number;
}

export interface TechStack {
    html?: boolean;
    css?: boolean;
    js?: boolean;
    react?: boolean;
    [key: string]: boolean | undefined;
}

export interface Concept {
    id: string;
    title: string;
    details?: string;
    link: string;
    platform: Platform;
    createdAt: string;
    updatedAt: string;
    metrics?: ConceptMetrics;
    techStack?: TechStack;
    images?: {
        small?: string;
        large?: string;
    };
    author?: {
        username: string;
        nicename?: string;
        avatar?: string;
    };
}

export interface ConceptDataContainer {
    concepts: Concept[];
    lastSynced: string;
}