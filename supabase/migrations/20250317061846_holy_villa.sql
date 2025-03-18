/*
  # Initial Schema Setup

  1. New Tables
    - private_rooms
      - id (uuid, primary key)
      - name (text)
      - created_at (timestamp)
      - created_by (uuid, references auth.users)
    
    - room_members
      - room_id (uuid, references private_rooms)
      - user_id (uuid, references auth.users)
      - joined_at (timestamp)
    
    - encrypted_messages
      - id (uuid, primary key)
      - room_id (uuid, references private_rooms)
      - sender_id (uuid, references auth.users)
      - encrypted_content (text)
      - created_at (timestamp)
    
    - video_downloads
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - video_url (text)
      - downloaded_at (timestamp)
    
    - premium_subscriptions
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - started_at (timestamp)
      - expires_at (timestamp)
      - payment_id (text)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create private_rooms table
CREATE TABLE private_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users NOT NULL
);

-- Create room_members table
CREATE TABLE room_members (
  room_id uuid REFERENCES private_rooms ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Create encrypted_messages table
CREATE TABLE encrypted_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES private_rooms ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users,
  encrypted_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create video_downloads table
CREATE TABLE video_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  video_url text NOT NULL,
  downloaded_at timestamptz DEFAULT now()
);

-- Create premium_subscriptions table
CREATE TABLE premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  payment_id text NOT NULL
);

-- Enable Row Level Security
ALTER TABLE private_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create rooms"
  ON private_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room members can view rooms"
  ON private_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can view messages"
  ON encrypted_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = encrypted_messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can send messages"
  ON encrypted_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = encrypted_messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their downloads"
  ON video_downloads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create downloads"
  ON video_downloads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their subscriptions"
  ON premium_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);