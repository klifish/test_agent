#!/usr/bin/env python3
"""
Gluttonous Snake Game - A classic Snake game implementation
Run with: python snake.py
"""

import random
import sys
import os
import time
import termios
import tty
import select


class SnakeGame:
    def __init__(self, width=20, height=10):
        self.width = width
        self.height = height
        self.snake = [(width // 2, height // 2)]  # Start in the middle
        self.direction = (1, 0)  # Moving right initially
        self.food = self.generate_food()
        self.score = 0
        self.game_over = False
        
    def generate_food(self):
        """Generate food at a random position not occupied by snake"""
        while True:
            food = (random.randint(0, self.width - 1), random.randint(0, self.height - 1))
            if food not in self.snake:
                return food
    
    def move(self):
        """Move the snake in the current direction"""
        if self.game_over:
            return
            
        head_x, head_y = self.snake[0]
        dx, dy = self.direction
        new_head = (head_x + dx, head_y + dy)
        
        # Check wall collision
        if (new_head[0] < 0 or new_head[0] >= self.width or 
            new_head[1] < 0 or new_head[1] >= self.height):
            self.game_over = True
            return
            
        # Check self collision
        if new_head in self.snake:
            self.game_over = True
            return
            
        self.snake.insert(0, new_head)
        
        # Check if food eaten
        if new_head == self.food:
            self.score += 1
            self.food = self.generate_food()
        else:
            self.snake.pop()  # Remove tail if no food eaten
    
    def change_direction(self, new_direction):
        """Change snake direction, but prevent reversing into itself"""
        dx, dy = new_direction
        current_dx, current_dy = self.direction
        
        # Prevent reversing direction
        if (dx, dy) != (-current_dx, -current_dy):
            self.direction = new_direction
    
    def draw(self):
        """Draw the game board"""
        os.system('clear' if os.name == 'posix' else 'cls')
        
        print(f"Score: {self.score}")
        print("+" + "-" * self.width + "+")
        
        for y in range(self.height):
            row = "|"
            for x in range(self.width):
                if (x, y) in self.snake:
                    if (x, y) == self.snake[0]:
                        row += "O"  # Head
                    else:
                        row += "o"  # Body
                elif (x, y) == self.food:
                    row += "*"  # Food
                else:
                    row += " "
            row += "|"
            print(row)
            
        print("+" + "-" * self.width + "+")
        
        if self.game_over:
            print("GAME OVER!")
            print("Press any key to exit...")
        else:
            print("Use WASD keys to move, Q to quit")


def get_key():
    """Get a single keypress from user"""
    if sys.platform == 'win32':
        import msvcrt
        return msvcrt.getch().decode('utf-8').lower()
    else:
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            # Check if input is available
            if select.select([sys.stdin], [], [], 0.1):
                key = sys.stdin.read(1).lower()
            else:
                key = None
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return key


def main():
    """Main game loop"""
    print("Welcome to Gluttonous Snake!")
    print("Use WASD keys to control the snake")
    print("Eat the food (*) to grow and increase your score")
    print("Don't hit the walls or yourself!")
    print("\nPress Enter to start...")
    input()
    
    game = SnakeGame()
    
    # Direction mappings
    directions = {
        'w': (0, -1),  # Up
        's': (0, 1),   # Down
        'a': (-1, 0),  # Left
        'd': (1, 0)    # Right
    }
    
    while not game.game_over:
        game.draw()
        
        # Get user input (non-blocking)
        key = get_key()
        
        if key == 'q':
            print("Thanks for playing!")
            break
        elif key in directions:
            game.change_direction(directions[key])
        
        game.move()
        time.sleep(0.2)  # Control game speed
    
    if game.game_over:
        game.draw()
        get_key()  # Wait for any key press
    

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nGame interrupted. Thanks for playing!")
    except Exception as e:
        print(f"An error occurred: {e}")