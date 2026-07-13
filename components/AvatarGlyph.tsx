// Avatar por defecto (sin foto de perfil todavía) — círculo con gradiente
// verde azulado + silueta, según el estilo de header visto en las
// pantallas de Stats/Classes de Figma. Cuando se sume carga de foto de
// perfil real, esto pasa a ser el fallback cuando no hay foto.
export default function AvatarGlyph({
  size = 32,
}: {
  size?: number;
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        backgroundImage:
          "radial-gradient(circle at 30% 30%, #5eead4 0%, #0d9488 55%, #042f2e 100%)",
      }}
    >
      <svg
        width={size * 0.45}
        height={size * 0.45}
        viewBox="0 0 14 14"
        fill="none"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="4.5" r="2.5" />
        <path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      </svg>
    </div>
  );
}
