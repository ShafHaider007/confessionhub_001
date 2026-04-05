import { Html, Body, Container, Heading, Text } from "@react-email/components";

interface VerificationEmailProps {
  code: string;
  username: string;
}

export function VerificationEmail({ code, username }: VerificationEmailProps) {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>Verify your email</Heading>
          <Text>Hello {username},</Text>
          <Text>Your verification code is: {code}</Text>
          <Text>This code will expire in 10 minutes.</Text>
          <Text>If you did not request this verification, please ignore this email.</Text>
          <Text>Thank you for using our service.</Text>
          <Text>Best regards, Shaf Haider</Text>
        </Container>
      </Body>
    </Html>
     
  );
}
