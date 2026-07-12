/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  appUrl?: string
  email?: string
  password?: string
}

const Email = ({ name, appUrl, email, password }: Props) => {
  const displayUrl = appUrl || 'https://okr-inhr.inovahr-app.com'
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Tu acceso a la plataforma de OKRs de InovaHR</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenido a la plataforma de OKRs</Heading>
          <Text style={text}>
            Hola {name || 'equipo'}, te damos acceso a la aplicación de gestión de
            OKRs de InovaHR. Desde aquí podrás dar seguimiento a objetivos,
            resultados clave e iniciativas.
          </Text>

          <Section style={card}>
            <Text style={cardLabel}>Enlace de acceso</Text>
            <Text style={cardValue}>{displayUrl}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Usuario (email)</Text>
            <Text style={cardValue}>{email}</Text>
            <Hr style={hr} />
            <Text style={cardLabel}>Contraseña inicial</Text>
            <Text style={cardValue}>{password}</Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={displayUrl} style={button}>
              Ingresar a la app
            </Button>
          </Section>

          <Text style={text}>
            Por seguridad, te recomendamos cambiar tu contraseña después del
            primer inicio de sesión.
          </Text>
          <Text style={muted}>
            Si no esperabas este correo, puedes ignorarlo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Tu acceso a la plataforma de OKRs de InovaHR',
  displayName: 'Invitación OKRs',
  previewData: {
    name: 'Ramón Torres',
    appUrl: 'https://okr-inhr.inovahr-app.com',
    email: 'usuario@ejemplo.com',
    password: 'Ejemplo1234',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { color: 'hsl(222, 47%, 11%)', fontSize: '22px', fontWeight: 'bold' as const, margin: '0 0 16px' }
const text = { color: 'hsl(222, 30%, 25%)', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const muted = { color: 'hsl(220, 10%, 46%)', fontSize: '13px', lineHeight: '20px', margin: '16px 0 0' }
const card = {
  backgroundColor: 'hsl(220, 20%, 97%)',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '8px 0 4px',
}
const cardLabel = { color: 'hsl(220, 10%, 46%)', fontSize: '12px', textTransform: 'uppercase' as const, margin: '8px 0 2px', letterSpacing: '0.04em' }
const cardValue = { color: 'hsl(222, 47%, 11%)', fontSize: '16px', fontWeight: 'bold' as const, margin: '0 0 8px' }
const hr = { borderColor: 'hsl(220, 15%, 88%)', margin: '8px 0' }
const button = {
  backgroundColor: 'hsl(220, 70%, 50%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  padding: '12px 28px',
  borderRadius: '12px',
  display: 'inline-block',
}
