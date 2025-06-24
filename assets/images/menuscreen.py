import pygame
import os

class MenuScreen:
    def __init__(self, screen):
        self.screen = screen
        self.font_title = pygame.font.SysFont(None, 72)
        self.font_button = pygame.font.SysFont(None, 48)
        self.play_button_rect = pygame.Rect(0, 0, 200, 80)
        self.play_button_rect.center = (screen.get_width() // 2, screen.get_height() // 2 + 200)

        # Load background image (logo.png)
        logo_path = os.path.join("assets", "logo.png")
        self.background = pygame.image.load(logo_path).convert()
        self.background = pygame.transform.scale(self.background, (screen.get_width(), screen.get_height()))

    def draw_text(self, text, font, color, center):
        text_surf = font.render(text, True, color)
        text_rect = text_surf.get_rect(center=center)
        self.screen.blit(text_surf, text_rect)

    def draw(self):
        self.screen.blit(self.background, (0, 0))

        pygame.draw.rect(self.screen, (70, 130, 180), self.play_button_rect)
        self.draw_text("MOVEmentum", self.font_title, (255, 255, 255), (self.screen.get_width() // 2, 150))
        self.draw_text("PLAY", self.font_button, (255, 255, 255), self.play_button_rect.center)

        pygame.display.flip()

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.play_button_rect.collidepoint(event.pos):
                return "go_to_map"  # Signal to switch to MapScreen
        return None
    
    def resize(self, width, height):
        self.play_button_rect.center = (width // 2, height // 2 + 200)
        self.background = pygame.transform.scale(self.background, (width, height))