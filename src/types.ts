export type SpecificVersion = `v${number}.${number}.${number}`;
export type LatestVersion = 'latest';
export type Version = SpecificVersion | LatestVersion;

export interface ElectronOllamaConfig {
  basePath: string;
  directory?: string;
}

export interface PlatformConfig {
  os: 'windows' | 'darwin' | 'linux';
  arch: 'arm64' | 'amd64';
}

export interface OllamaAssetMetadata {
  digest: string;
  size: number;
  sizeMB: string;
  fileName: string;
  contentType: string;
  version: SpecificVersion;
  downloads: number;
  downloadUrl: string;
  releaseUrl: string;
  body: string;
}

export interface OllamaServerConfig {
  binPath: string;
  log: (message: string) => void;
}

export interface GitHubAsset {
  url: string;
  id: number;
  node_id: string;
  name: string;
  label: string | null;
  content_type: string;
  state: string;
  size: number;
  digest: string;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}

export interface GitHubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  immutable: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GitHubAsset[];
  tarball_url: string;
  zipball_url: string;
  body: string;
}
