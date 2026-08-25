import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  bidAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  bidSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  lowestBid(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  lowestBidder(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { bytes: Uint8Array
                                                                           }];
  currentBlock(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  createAuction(context: __compactRuntime.CircuitContext<PS>,
                org_0: { bytes: Uint8Array },
                dl_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitBid(context: __compactRuntime.CircuitContext<PS>,
            commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revealBid(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  finalizeAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  createAuction(context: __compactRuntime.CircuitContext<PS>,
                org_0: { bytes: Uint8Array },
                dl_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitBid(context: __compactRuntime.CircuitContext<PS>,
            commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revealBid(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  finalizeAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  createAuction(context: __compactRuntime.CircuitContext<PS>,
                org_0: { bytes: Uint8Array },
                dl_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  commitBid(context: __compactRuntime.CircuitContext<PS>,
            commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revealBid(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  finalizeAuction(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly auctionActive: boolean;
  readonly deadline: bigint;
  commitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: { bytes: Uint8Array }): boolean;
    lookup(key_0: { bytes: Uint8Array }): Uint8Array;
    [Symbol.iterator](): Iterator<[{ bytes: Uint8Array }, Uint8Array]>
  };
  readonly winner: { bytes: Uint8Array };
  readonly winningPrice: bigint;
  readonly organizer: { bytes: Uint8Array };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
