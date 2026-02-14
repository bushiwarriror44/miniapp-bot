import { fetchDatasetFromApi } from "./dataSource";

export type GuarantConfig = {
  guarantor: {
    username: string;
    displayName: string;
    profileLink: string;
  };
  commissionTiers: string[];
  aboutText: string;
};

export async function fetchGuarantConfig(): Promise<GuarantConfig> {
  const payload = await fetchDatasetFromApi<GuarantConfig>("guarantConfig");
  if (!payload) {
    throw new Error('Failed to load "guarantConfig" from content API');
  }
  return payload;
}
