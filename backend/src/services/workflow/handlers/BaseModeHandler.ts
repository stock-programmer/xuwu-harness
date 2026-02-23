import { ModeExecutionResult } from '../../../types/workflow.types';

/**
 * Mode Execution Context
 */
export interface ModeExecutionContext {
  input: string;
  workingDir: string;
  previousArtifacts: string[];
  projectContext: Record<string, any>;
}

/**
 * Base Mode Handler Abstract Class
 * All mode handlers must extend this class and implement the required methods
 */
export abstract class BaseModeHandler {
  /**
   * Execute the mode with given input and context
   * @param input - The input string for the mode
   * @param context - The execution context containing working directory, artifacts, etc.
   * @returns Promise<ModeExecutionResult> - The result of the mode execution
   */
  abstract execute(
    input: string,
    context: ModeExecutionContext
  ): Promise<ModeExecutionResult>;

  /**
   * Validate preconditions before executing the mode
   * @param context - The execution context
   * @returns Promise<boolean> - True if preconditions are met, false otherwise
   */
  abstract validatePreconditions(
    context: ModeExecutionContext
  ): Promise<boolean>;

  /**
   * Validate the output/result after mode execution
   * @param result - The result to validate
   * @returns Promise<boolean> - True if output is valid, false otherwise
   */
  abstract validateOutput(result: ModeExecutionResult): Promise<boolean>;

  /**
   * Get the name of the mode handler
   * @returns string - The mode name
   */
  abstract getModeName(): string;
}
