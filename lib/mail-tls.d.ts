export declare function mailCaCertificates(): string[] | undefined;
/** The TLS option object accepted by imapflow, nodemailer and the POP3 socket. */
export declare function mailTlsOptions(): {
    ca?: string[];
};
