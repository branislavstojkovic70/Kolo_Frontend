import {
	AppBar,
	Box,
	Button,
	Drawer,
	IconButton,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Toolbar,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
	Storefront,
	ReceiptLong,
	Gavel,
	NotificationsOutlined,
	AdminPanelSettingsOutlined,
	Logout,
	Menu,
	Person,
	LightMode,
	DarkMode,
} from "@mui/icons-material";
import { useState } from "react";
import { navy, useThemeMode } from "../theme";

const navItems = [
	{ label: "Marketplace", icon: <Storefront />, path: "/ads" },
	{ label: "Orders", icon: <ReceiptLong />, path: "/orders" },
	{ label: "Disputes", icon: <Gavel />, path: "/disputes" },
	{ label: "Notifications", icon: <NotificationsOutlined />, path: "/notifications" },
	{ label: "Admin", icon: <AdminPanelSettingsOutlined />, path: "/admin" },
	{ label: "Profile", icon: <Person />, path: "/profile" },
];

export default function Navbar() {
	const navigate = useNavigate();
	const location = useLocation();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const { mode, toggleMode } = useThemeMode();

	const [drawerOpen, setDrawerOpen] = useState(false);

	const handleLogout = () => navigate("/login");

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<AppBar
				position="relative"
				elevation={0}
				sx={{
					flex: "0 1 auto",
					bgcolor: navy,
				}}
			>
				<Toolbar
					sx={{
						minHeight: "calc(64px + 2rem)",
						px: 2,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Box
						onClick={() => navigate("/")}
						sx={{
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							gap: 1,
							flex: "1 1 0%",
						}}
					>
						<img
							src="/logo.png"
							alt="Kolo logo"
							style={{
								height: 64,
								width: "auto",
							}}
						/>
					</Box>

					<Box
						sx={{
							display: { xs: "none", md: "flex" },
							gap: 3,
							justifyContent: "center",
							alignItems: "center",
							flex: "1 1 0%",
						}}
					>
						{navItems.map((item) => {
							const isActive = location.pathname === item.path;
							return (
								<Button
									key={item.label}
									startIcon={item.icon}
									onClick={() => navigate(item.path)}
									sx={{
										color: isActive ? theme.palette.primary.main : "#FFFFFF",
										fontWeight: isActive ? 600 : 500,
										textTransform: "capitalize",
									}}
								>
									{item.label}
								</Button>
							);
						})}
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "flex-end",
							alignItems: "center",
							gap: 1,
							flex: "1 1 0%",
						}}
					>
						<IconButton
							onClick={toggleMode}
							aria-label="Toggle theme"
							sx={{ color: "#FFFFFF" }}
						>
							{mode === "dark" ? <LightMode /> : <DarkMode />}
						</IconButton>

						{isMobile ? (
							<IconButton
								onClick={() => setDrawerOpen(true)}
								aria-label="Open navigation"
								sx={{ color: "#FFFFFF" }}
							>
								<Menu />
							</IconButton>
						) : (
							<Button
								startIcon={<Logout />}
								onClick={handleLogout}
								sx={{
									color: "#FFFFFF",
									textTransform: "capitalize",
								}}
							>
								Logout
							</Button>
						)}
					</Box>
				</Toolbar>
			</AppBar>

			<Drawer
				anchor="right"
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
			>
				<Box
					sx={{ width: 250 }}
					role="presentation"
					onClick={() => setDrawerOpen(false)}
				>
					<List>
						{navItems.map((item) => (
							<ListItemButton
								key={item.label}
								onClick={() => navigate(item.path)}
							>
								<ListItemIcon>{item.icon}</ListItemIcon>
								<ListItemText primary={item.label} />
							</ListItemButton>
						))}
						<ListItemButton onClick={handleLogout}>
							<ListItemIcon>
								<Logout />
							</ListItemIcon>
							<ListItemText primary="Logout" />
						</ListItemButton>
					</List>
				</Box>
			</Drawer>

			<div id="detail" style={{ flex: "1 1 auto", width: "100%" }}>
				<Outlet />
			</div>
		</Box>
	);
}
