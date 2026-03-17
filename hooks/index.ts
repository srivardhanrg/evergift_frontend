// New unified state machine hook (replaces usePreviewLoader + useGenerationPolling)
export { usePreviewStateMachine } from './usePreviewStateMachine';

// V2 state machine for 26-page book structure
export { usePreviewStateMachineV2 } from './usePreviewStateMachineV2';
export type { MachineStateV2, UsePreviewStateMachineV2Return } from './usePreviewStateMachineV2';

// Keep legacy hooks for backwards compatibility
export { usePreviewLoader } from './usePreviewLoader';
export { useGenerationPolling } from './useGenerationPolling';

// Other hooks
export { usePaymentFlow } from './usePaymentFlow';
export { usePdfDownload } from './usePdfDownload';
export { useResponsive } from './useResponsive';

// Export types from state machine (preferred)
export type { LockedPage, GenerationPhase, MachineState } from './usePreviewStateMachine';

// Legacy type exports (for backwards compatibility)
export type { InitialPhaseState } from './usePreviewLoader';
