-- Migration: Create chat_messages table
-- This file should be run in Supabase SQL Editor

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schema_id UUID NOT NULL REFERENCES public.schemas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_schema_id ON public.chat_messages(schema_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read their own messages
CREATE POLICY "Users can view their own chat messages"
    ON public.chat_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own chat messages"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own messages
CREATE POLICY "Users can update their own chat messages"
    ON public.chat_messages
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own chat messages"
    ON public.chat_messages
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS update_chat_messages_updated_at_trigger ON public.chat_messages;
CREATE TRIGGER update_chat_messages_updated_at_trigger
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

