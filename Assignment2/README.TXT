Issue:
Sometimes I make some changes to my template, however it does not reflect right away on safari, because I can’t use command+shift+R to reload the scene. Google works fines.

Audio:
local host on different browsers:
Safari: works perfectly fine.
Google: It doesn’t work.

1. 
Custom shape and Discontinuity 

My Custom shape is a pyramid with four sides of triangles and the bottom is a square. I first create with four triangles and divide the bottom into two triangles, and then pushing the points position, calculating the surface normals and assigning appropriate textures to the polygon objects.

Discontinuity: you can spot the discontinuity on the edge of the mountains (pyramid), which you can see the light difference between two sides, one side receives more lights, and the other side receives less light. You need to achieve this by create a flat_shading.


Meeting criteria:

Hierarchical objects (flowers): I created a flowers with four stems and the flower, and swing left and right with constant degrees.

Camera tracking: I utilized the lookAt to first get the right position, and then have the camera move as the character move further away.

Polygon Object: I describe above.

Assign reasonable texture: above.

Discontinuity: above 

Read-Time: at first my character is moving too slow, and i increasing the speed to match the animation time.

Frame Rate: I displayed frame rate by taking the following formula:
 Math.round(1/(this.globals.graphics_state.animation_delta_time/1000))

Creativity: I created box and then scale it to bigger and then move back to cover the whole scene and have the flowers on the side, basically what I want to create is a nature scene 

Impressive Mechanic: Camera transform and moving the character on the designed path.

Fluidity and camera motion: camera describe above, and I believe mine is running pretty fast on google chrome, however it does not run very fluent on the safari, maybe is the choice of the browser. 





