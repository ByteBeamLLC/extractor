// Supabase persistence layer for table state
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import type { TableState } from "@/components/tanstack-grid/utils/tableState";
import { serializeTableState, deserializeTableState } from "@/components/tanstack-grid/utils/tableState";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Load table state from Supabase for a given schema
 */
export async function loadTableState(
  supabase: SupabaseClientType,
  schemaId: string
): Promise<TableState | null> {
  try {
    const { data, error } = await supabase
      .from("schemas")
      .select("table_state")
      .eq("id", schemaId)
      // Use maybeSingle so we don't throw a 406 if the row doesn't exist yet (new schema)
      .maybeSingle();

    if (error) {
      console.error("[tableState] Error loading table state:", error);
      return null;
    }

    if (!data || !data.table_state) {
      return null;
    }

    // Handle both string and object formats
    if (typeof data.table_state === 'string') {
      return deserializeTableState(data.table_state);
    } else {
      return data.table_state as TableState;
    }
  } catch (err) {
    console.error("[tableState] Exception loading table state:", err);
    return null;
  }
}

/**
 * Save table state to Supabase for a given schema
 */
export async function saveTableState(
  supabase: SupabaseClientType,
  schemaId: string,
  state: TableState
): Promise<boolean> {
  try {
    // Save as JSONB object directly, not as string
    const { error } = await supabase
      .from("schemas")
      .update({ table_state: state as any }) // Cast to any for JSONB
      .eq("id", schemaId);

    if (error) {
      console.error("[tableState] Error saving table state:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[tableState] Exception saving table state:", err);
    return false;
  }
}

/**
 * Create a debounced save function
 */
export function createDebouncedSave(
  supabase: SupabaseClientType,
  schemaId: string,
  delay: number = 500
): (state: TableState) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestState: TableState | null = null;

  const flush = async () => {
    if (latestState && timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      await saveTableState(supabase, schemaId, latestState);
      latestState = null;
    }
  };

  const debouncedSave = (state: TableState) => {
    latestState = state;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      void flush();
    }, delay);
  };

  // Return the debounced function with a flush method
  return Object.assign(debouncedSave, { flush });
}

/**
 * Clear table state for a schema (reset to defaults)
 */
export async function clearTableState(
  supabase: SupabaseClientType,
  schemaId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("schemas")
      .update({ table_state: {} })
      .eq("id", schemaId);

    if (error) {
      console.error("[tableState] Error clearing table state:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[tableState] Exception clearing table state:", err);
    return false;
  }
}
