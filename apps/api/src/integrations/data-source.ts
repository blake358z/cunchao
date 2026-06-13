export interface ExternalDataSource<T> {
  name: string;
  fetchLatest(): Promise<T[]>;
}

export class NotConfiguredSource<T> implements ExternalDataSource<T> {
  constructor(public readonly name: string) {}

  async fetchLatest(): Promise<T[]> {
    return [];
  }
}

export const futureSources = {
  officialLeagueApi: new NotConfiguredSource("official-league-api"),
  ticketingApi: new NotConfiguredSource("ticketing-api"),
  paymentGateway: new NotConfiguredSource("payment-gateway"),
  wechatAuth: new NotConfiguredSource("wechat-auth")
};

