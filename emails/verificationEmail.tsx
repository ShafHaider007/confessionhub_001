import { Html, Body, Container, Heading, Text, Button } from '@react-email/components';


interface VerificationEmailProps {
  code: string;
  username: string;
}
export function VerificationEmail({ code, username }: VerificationEmailProps) {
  return (
    // here user get verification code to verify their email address
    <Html>
      <Body>
        <Container>
          <Heading>Verification Email</Heading>
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
