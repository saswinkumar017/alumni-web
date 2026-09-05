export interface UserSettings {
  readonly theme: "light";
  readonly language: string;
  readonly notifications: {
    readonly email: boolean;
    readonly push: boolean;
    readonly sms: boolean;
  };
  readonly privacy: {
    readonly showEmail: boolean;
    readonly showPhone: boolean;
    readonly showLocation: boolean;
  };
}