/*
  # Create Facebook API logs table

  1. New Tables
    - `facebook_api_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `endpoint` (text)
      - `method` (text)
      - `response_code` (integer)
      - `action_type` (text)
      - `request_body` (jsonb)
      - `response_body` (jsonb)
      - `error_message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `facebook_api_logs` table
    - Add policy for authenticated users to read logs
    - Add policy for admin users to read all logs
*/

CREATE TABLE IF NOT EXISTS facebook_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  response_code integer NOT NULL DEFAULT 0,
  action_type text NOT NULL,
  request_body jsonb,
  response_body jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE facebook_api_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own logs
CREATE POLICY "Users can read own API logs"
  ON facebook_api_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for admin users to read all logs
CREATE POLICY "Admin users can read all API logs"
  ON facebook_api_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy for system to insert logs
CREATE POLICY "System can insert API logs"
  ON facebook_api_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_api_logs_user_id ON facebook_api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_api_logs_created_at ON facebook_api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_facebook_api_logs_action_type ON facebook_api_logs(action_type);