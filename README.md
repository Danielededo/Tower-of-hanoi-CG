# Tower of Hanoi Project - Computer Graphics Course @Polimi (AY 2020-2021)

## Description

### Introduction
The Tower of Hanoi is a mathematical puzzle. It consists of three rods and a number of discs (in our case 4 discs) of different sizes, which can slide onto any rod. The puzzle starts with the discs in a stack in ascending order of size on the first rod, with the smallest at the top (thus making a conical shape).

The objective of the game is to move the entire stack to another rod, obeying the following simple rules:
1. only one disc can be moved at a time;
2. each move consists of taking the upper disc from one of the rods and placing into another rod;
3. no disc can be placed on top of a smaller disc.

### Screenshot
Here follows a screenshot of the application:
![](screenshot.png)

### Implementation
The application has been written in JavaScript and GLSL (to specify the rendering operations in WebGL).
We have used some libraries, among which TWGL.js and Quaternion.js.

### Shading Space
The shading space adopted in this project is WORLD SPACE.

### Projection Type
The projection type adopted in this project is PERSPECTIVE PROJECTION.

## Ways of control 
1. You can drag the screen by mouse to adjust the camera view;
2. you can click buttons on the right side of the web page (or press keys denoted in texts of buttons) to move discs;
3. you can zoom in or zoom out using the mouse wheel; 
4. you can change:
    - the light type (Direct or Point),
    - the ambient light color,
    - the diffuse type (Lambert, Toon, or no diffuse),
    - the specular type (Phong, Blinn, Toon Phong, Toon Blinn, or no specular),
    - the texture level of the rods (through a slider).

## Executing the project
The latest version of the project is available at [this GitHub Page](https://github.com/Danielededo/Tower-of-hanoi-CG), but it can also be built offline by cloning this repository and running a webserver (e.g. Apache) in the same folder.

## Authors
- [Daniele De Dominicis](https://github.com/Danielededo)
- [Leonardo Guerra](https://github.com/leoguerra8)
