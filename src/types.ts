/**
 * StudyBuddy Core Type Declarations
 */

export interface UserProfile {
  email: string;
  targetExam: string; // 'NEET' | 'JEE' | 'CUET' | 'CAT' | 'GATE' | 'UPSC' | 'Other'
  customExam?: string;
  onboarded: boolean;
  chibi: ChibiCustomization;
}

export interface ChibiCustomization {
  gender: 'boy' | 'girl' | 'neutral';
  hat: 'none' | 'beanie' | 'cap' | 'headphones';
  top: 'hoodie' | 'tshirt' | 'sweater';
  pants: 'jeans' | 'shorts' | 'sweatpants';
  shoes: 'sneakers' | 'boots' | 'slippers';
}

export interface MoodLog {
  id: string;
  timestamp: string; // ISO string
  stress: number;    // 1-10
  anxiety: number;   // 1-10
  happiness: number; // 1-10
  confusion: number; // 1-10
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  mode: 'notepad' | 'markdown' | 'drawing';
  drawingData?: string; // base64 canvas image data
}

export interface StudySuggestion {
  id: string;
  timestamp: string;
  text: string;
  type: 'academic' | 'wellbeing';
  examContext?: string;
}

export interface CrisisAlert {
  id: string;
  timestamp: string;
  message: string;
  active: boolean;
}

export interface StudyMaterial {
  id: string;
  name: string;
  mimeType: string;
  summary: string;
  timestamp: string;
  size: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
