import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export interface Pool {
  autotrim: ZfsProperty<string>;
  encrypt: number;
  encryptkey: string;
  encryptkey_path: string;
  guid: string;
  healthy: boolean;
  id: number;
  is_decrypted: boolean;
  name: string;
  path: string;
  scan: PoolScan;
  status: PoolStatus;
  status_detail: any;
  topology: PoolTopology;
}

export interface PoolTopology {
  cache: VDev[];
  data: VDev[];
  dedup: VDev[];
  log: VDev[];
  spare: VDev[];
  special: VDev[];
}

export type PoolTopologyCategory = keyof PoolTopology;

export interface PoolScan {
  bytes_issued: number;
  bytes_processed: number;
  bytes_to_process: number;
  end_time: ApiTimestamp;
  errors: number;
  function: 'SCRUB'; // TODO: Unknown what other values are
  pause: any;
  percentage: number;
  start_time: ApiTimestamp;
  state: PoolScanState;
  total_secs_left: number;
}
