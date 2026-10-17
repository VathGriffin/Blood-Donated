'use client';
import { Avatar, Box, Container, Paper, Typography, useTheme } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import CodeIcon from "@mui/icons-material/Code";
import RichText from "@/components/ui/RichText";
import { initialsOf } from "@/lib/format";
import FavoriteIcon from "@mui/icons-material/Favorite";

const PROJECT = "Individual Graduation Project";

const badges = [
  { icon: <SchoolIcon />, label: "Education", value: "Hanoi University of Science and Technology (HUST)" },
  { icon: <CodeIcon />, label: "Technology", value: "Next.js · Node.js · MongoDB · AI integration" },
  { icon: <FavoriteIcon />, label: "Mission", value: "Healthcare & Social Impact" },
];

const RED = "#c62828";

// Small "EYEBROW ——" label used above the section heading and the creator's name.
function Eyebrow({ children, id }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
      <Typography id={id} variant="overline" color="error" fontWeight={700} letterSpacing="0.14em" lineHeight={1.6}>
        {children}
      </Typography>
      <Box aria-hidden sx={{ width: 40, height: 2, borderRadius: 2, backgroundColor: "error.main" }} />
    </Box>
  );
}

function Portrait({ isDark, photo, name }) {
  const size = { xs: 184, sm: 168, md: 224 };
  const ring = (sx) => <Box aria-hidden sx={{ position: "absolute", borderRadius: "50%", ...sx }} />;
  const tint = isDark ? "rgba(229,57,53,0.16)" : "rgba(229,57,53,0.12)";

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      {/* layered decorative circles */}
      {ring({ inset: "-14%", backgroundColor: tint })}
      {ring({ width: "46%", height: "46%", left: "-20%", bottom: "-16%", backgroundColor: tint })}
      {ring({ width: 22, height: 22, left: "-6%", top: "2%", backgroundColor: isDark ? "rgba(229,57,53,0.3)" : "rgba(229,57,53,0.22)" })}
      {ring({ width: 14, height: 14, left: "-22%", top: "38%", backgroundColor: isDark ? "rgba(229,57,53,0.25)" : "rgba(229,57,53,0.18)" })}
      {ring({ width: 18, height: 18, right: "-8%", top: "-6%", backgroundColor: isDark ? "rgba(229,57,53,0.25)" : "rgba(229,57,53,0.18)" })}

      <Avatar
        src={photo || undefined}
        alt={`Portrait of ${name}, creator of BloodLife AI`}
        sx={{
          position: "relative", width: "100%", height: "100%",
          fontSize: { xs: "3.2rem", md: "4rem" }, fontWeight: 800, letterSpacing: "0.02em", color: "#fff",
          background: `radial-gradient(circle at 35% 30%, #ef5350 0%, ${RED} 55%, #8e0000 100%)`,
          border: `6px solid ${isDark ? "#1f1416" : "#fff"}`,
          boxShadow: "0 18px 40px rgba(183,28,28,0.28)",
        }}
      >
        {initialsOf(name)}
      </Avatar>

      <Box aria-hidden sx={{
        position: "absolute", right: "-2%", bottom: "6%", width: { xs: 50, md: 58 }, height: { xs: 50, md: 58 },
        borderRadius: "50%", backgroundColor: RED, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `4px solid ${isDark ? "#1f1416" : "#fff"}`, boxShadow: "0 8px 20px rgba(183,28,28,0.35)",
        "& svg": { fontSize: { xs: 24, md: 28 } },
      }}>
        <CodeIcon />
      </Box>
    </Box>
  );
}

// `team` is { name, position, bio } and `photo` an absolute URL, both edited in Settings → About Page.
// Without a photo the card shows the creator's initials.
export default function CreatorProfile({ team, photo }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const heading = isDark ? "#fff" : "#161a23";

  return (
    <Box component="section" id="team-section" aria-labelledby="builders-heading"
      sx={{ backgroundColor: isDark ? "#0f0f0f" : "#fff", py: { xs: 8, md: 11 } }}>
      <Container maxWidth="lg">
        <Box textAlign="center" mb={{ xs: 5, md: 7 }}>
          <Box mb={1}><Eyebrow>The Builder</Eyebrow></Box>
          <Typography id="builders-heading" component="h2" sx={{
            fontWeight: 800, fontSize: { xs: "1.85rem", sm: "2.3rem", md: "2.75rem" },
            lineHeight: 1.15, letterSpacing: "-0.02em", color: heading, mb: 2,
          }}>
            The Builders{" "}
            <Box component="span" sx={{ color: "error.main" }}>Behind It</Box>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 640, mx: "auto", lineHeight: 1.75, fontSize: { xs: "0.95rem", md: "1.05rem" } }}>
            BloodLife AI is developed as an individual graduation project, combining modern web
            technologies and AI to create a real-world solution for blood donation management in
            healthcare communities.
          </Typography>
        </Box>

        <Paper component="article" aria-labelledby="creator-name" elevation={0} sx={{
          maxWidth: 1100, mx: "auto", overflow: "hidden", borderRadius: "20px",
          display: "grid", gridTemplateColumns: { xs: "1fr", sm: "250px 1fr", md: "34% 1fr" },
          border: `1px solid ${isDark ? "rgba(229,57,53,0.25)" : "#f6d4d4"}`,
          background: isDark
            ? "linear-gradient(135deg, #1f1416 0%, #161112 100%)"
            : "linear-gradient(135deg, #fff5f5 0%, #fffafa 55%, #ffffff 100%)",
          boxShadow: isDark ? "none" : "0 20px 50px rgba(183,28,28,0.08), 0 2px 8px rgba(0,0,0,0.03)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.4)" : "0 26px 60px rgba(183,28,28,0.13), 0 2px 8px rgba(0,0,0,0.03)",
          },
        }}>
          <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "center",
            py: 6, px: { xs: 4, sm: 3, md: 4 },
            backgroundColor: isDark ? "rgba(229,57,53,0.05)" : "rgba(253,234,234,0.55)",
            borderRight: { sm: `1px solid ${isDark ? "rgba(229,57,53,0.18)" : "#f8dede"}` },
            borderBottom: { xs: `1px solid ${isDark ? "rgba(229,57,53,0.18)" : "#f8dede"}`, sm: "none" },
          }}>
            <Portrait isDark={isDark} photo={photo} name={team.name} />
          </Box>

          <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, textAlign: { xs: "center", sm: "left" } }}>
            <Eyebrow>Project Creator</Eyebrow>
            <Typography id="creator-name" component="h3" sx={{
              fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.3rem" }, lineHeight: 1.15,
              letterSpacing: "-0.015em", color: heading, mt: 0.5,
            }}>
              {team.name}
            </Typography>
            <Typography sx={{ color: "error.main", fontWeight: 600, fontSize: { xs: "1.02rem", md: "1.12rem" }, mt: 0.75 }}>
              {PROJECT}
            </Typography>
            <Typography sx={{ color: isDark ? "grey.300" : "#4b5563", fontWeight: 500, fontSize: { xs: "0.95rem", md: "1.02rem" }, mt: 0.25 }}>
              {team.position}
            </Typography>
            <RichText value={team.bio} sx={{
              mt: 2, maxWidth: 560, mx: { xs: "auto", sm: 0 }, color: "text.secondary",
              lineHeight: 1.75, fontSize: { xs: "0.92rem", md: "0.98rem" },
              // the card is centred on phones; keep list bullets lined up with their text
              "& ul, & ol": { textAlign: "left", display: { xs: "inline-block", sm: "block" } },
            }} />

            <Box component="ul" sx={{
              listStyle: "none", p: 0, m: 0, mt: 3.5,
              display: "grid", gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            }}>
              {badges.map((b) => (
                <Box component="li" key={b.label} sx={{
                  display: "flex", alignItems: "center", gap: 1.25, textAlign: "left",
                  px: 1.75, py: 1.25, borderRadius: "16px",
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fff",
                  border: `1px solid ${isDark ? "rgba(229,57,53,0.25)" : "#f6d4d4"}`,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { borderColor: "error.light", boxShadow: "0 6px 16px rgba(183,28,28,0.1)" },
                }}>
                  <Box aria-hidden sx={{ color: "error.main", display: "flex", flexShrink: 0, "& svg": { fontSize: 24 } }}>
                    {b.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "error.main", lineHeight: 1.4 }}>
                      {b.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.35, color: isDark ? "grey.100" : "#1f2937" }}>
                      {b.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
