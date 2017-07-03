// CS 174a Project 3 Ray Tracer Skeleton
var mult_3_coeffs = function( a, b ) { return [ a[0]*b[0], a[1]*b[1], a[2]*b[2] ]; };       // Convenient way to combine two color-reducing vectors

function computev(a,b) { return add(scale_vec(-2*dot(a,b),a),b); }

Declare_Any_Class( "Ball",              // The following data members of a ball are filled in for you in Ray_Tracer::parse_line():
  { 'construct'( position, size, color, k_a, k_d, k_s, n, k_r, k_refract, refract_index )
      {
      //This built-in function automatically fills the data members accordingly with the function parameters
      this.define_data_members( { position, size, color, k_a, k_d, k_s, n, k_r, k_refract, refract_index } );

      // TODO:  Finish filling in data members, using data already present in the others.
      this.model_transform = mult(translation(this.position),scale(size));
      this.M_inv = inverse(this.model_transform);

      },
    'intersect'( ray, existing_intersection, minimum_dist )
    {
  // TODO:  Given a ray, check if this Ball is in its path.  Recieves as an argument a record of the nearest intersection found so far (a Ball pointer, a t distance
  //        value along the ray, and a normal), updates it if needed, and returns it.  Only counts intersections that are at least a given distance ahead along the ray.
  //        Tip:  Once intersect() is done, call it in trace() as you loop through all the spheres until you've found the ray's nearest available intersection.  Simply
  //        return a dummy color if the intersection tests positiv.  This will show the spheres' outlines, giving early proof that you did intersect() correctly.


  ///inverse the ray to get the standard ray in the enevironment w
        var S = mult_vec(this.M_inv, ray.origin).slice(0,3);
        var c = mult_vec(this.M_inv, ray.dir).slice(0,3);
    ///calcuate each part of the quadratic equution 
        var sqrt_c = dot(c,c);
        var c_dot_S = dot(c,S);
        var S_dot_S = dot(S,S) -1;
        var des = c_dot_S *c_dot_S  - sqrt_c*S_dot_S ;

        // if it is less than 0 then we just return the existing_interestion, since there is none intersection
        if (des < 0 )
            return existing_intersection;
       /// solve for t 
        var hit_1 = -c_dot_S/sqrt_c - Math.sqrt(des)/sqrt_c ;
        var hit_2 = -c_dot_S/sqrt_c  + Math.sqrt(des)/sqrt_c ;
      
      /// first set the firsrt hit to dis and set the boolean value 
        var dis = hit_1;
        var is_inside = false;

        // if it is greater and equal to zero which means we have at least one or more intersecion points 
        if (des >= 0)
        {
          // if the hit_1 dis is less than the min_dis and hit_2 greater than min_dis  and hit_2 is less than the 
          //exsiting distance 
         if (dis < minimum_dist && hit_2 > minimum_dist && hit_2 < existing_intersection.distance)
          {
            is_inside = true;
            dis= hit_2;
          }
        }

        // use the hit distance to find out the intersect point 
        var p = add(scale_vec(dis,c),S).concat(1);

        // calculate the normal 
        var normal = normalize(mult_vec(inverse(transpose(this.model_transform)),p).slice(0,3));

        // Negate all the intersect point inside the ball
        if (is_inside === true)
            normal = negate(normal);

        // assign value to the exisiting_intersection ball if neccessay 
        if (dis > minimum_dist && dis < existing_intersection.distance)
        {
            existing_intersection.distance = dis;
            existing_intersection.ball = this;
            existing_intersection.normal = normal;
        }

        return existing_intersection;
      }
  } );

Declare_Any_Class( "Ray_Tracer",
  { 'construct'( context )
      { this.define_data_members( { width: 32, height: 32, near: 1, left: -1, right: 1, bottom: -1, top: 1, ambient: [.1, .1, .1],
                                    balls: [], lights: [], curr_background_function: "color", background_color: [0, 0, 0, 1 ],
                                    scanline: 0, visible: true, scratchpad: document.createElement('canvas'), gl: context.gl,
                                    shader: context.shaders_in_use["Phong_Model"] } );
        var shapes = { "square": new Square(),                  // For texturing with and showing the ray traced result
                       "sphere": new Subdivision_Sphere( 4 ) };   // For drawing with ray tracing turned off
        this.submit_shapes( context, shapes );

        this.texture = new Texture ( context.gl, "", false, false );           // Initial image source: Blank gif file
        this.texture.image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        context.textures_in_use[ "procedural" ]  =  this.texture;

        this.scratchpad.width = this.width;  this.scratchpad.height = this.height;
        this.imageData          = new ImageData( this.width, this.height );     // Will hold ray traced pixels waiting to be stored in the texture
        this.scratchpad_context = this.scratchpad.getContext('2d');             // A hidden canvas for assembling the texture

        this.background_functions =                 // These convert a ray into a color even when no balls were struck by the ray.
          { waves: function( ray )
            { return Color( .5*Math.pow( Math.sin( 2*ray.dir[0] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[0] + Math.sin( 10*ray.dir[1] ) + Math.sin( 10*ray.dir[2] ) ) ),
                            .5*Math.pow( Math.sin( 2*ray.dir[1] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[1] + Math.sin( 10*ray.dir[0] ) + Math.sin( 10*ray.dir[2] ) ) ),
                            .5*Math.pow( Math.sin( 2*ray.dir[2] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[2] + Math.sin( 10*ray.dir[1] ) + Math.sin( 10*ray.dir[0] ) ) ), 1 );
            },
            lasers: function( ray )
            { var u = Math.acos( ray.dir[0] ), v = Math.atan2( ray.dir[1], ray.dir[2] );
              return Color( 1 + .5 * Math.cos( 20 * ~~u  ), 1 + .5 * Math.cos( 20 * ~~v ), 1 + .5 * Math.cos( 8 * ~~u ), 1 );
            },
            mixture:     ( function( ray ) { return mult_3_coeffs( this.background_functions["waves" ]( ray ),
                                                                   this.background_functions["lasers"]( ray ) ).concat(1); } ).bind( this ),
            ray_direction: function( ray ) { return Color( Math.abs( ray.dir[ 0 ] ), Math.abs( ray.dir[ 1 ] ), Math.abs( ray.dir[ 2 ] ), 1 );  },
            color:       ( function( ray ) { return this.background_color;  } ).bind( this )
          };
        this.make_menu();
        this.load_case( "show_homework_spec" );
      },
    'get_dir'( ix, iy )
      {
    // TODO:  Map an (x,y) pixel to a corresponding xyz vector that reaches the near plane.  If correct, everything under the "background effects" menu will now work.
         var alpha = ix / this.width;
         var beta =  iy / this.height;

         var x = this.left + alpha * (this.right - this.left);
         var y = this.bottom + beta * (this.top - this.bottom);
         var z = -this.near

         return vec4( x, y, z, 0 );
      },
    'color_missed_ray'( ray ) { return mult_3_coeffs( this.ambient, this.background_functions[ this.curr_background_function ] ( ray ) ).concat(1); },
    'trace'( ray, color_remaining, is_primary, light_to_check = null )
      {
    // TODO:  Given a ray, return the color in that ray's path.  The ray either originates from the camera itself or from a secondary reflection or refraction off of a
    //        ball.  Call Ball.prototype.intersect on each ball to determine the nearest ball struck, if any, and perform vector math (the Phong reflection formula)
    //        using the resulting intersection record to figure out the influence of light on that spot.  Recurse for reflections and refractions until the final color
    //        is no longer significantly affected by more bounces.
    //
    //        Arguments besides the ray include color_remaining, the proportion of brightness this ray can contribute to the final pixel.  Only if that's still
    //        significant, proceed with the current recursion, computing the Phong model's brightness of each color.  When recursing, scale color_remaining down by k_r
    //        or k_refract, multiplied by the "complement" (1-alpha) of the Phong color this recursion.  Use argument is_primary to indicate whether this is the original
    //        ray or a recursion.  Use the argument light_to_check when a recursive call to trace() is for computing a shadow ray.

        if( length( color_remaining ) < .3 )    return Color( 0, 0, 0, 1 );  // Each recursion, check if there's any remaining potential for the pixel to be brightened.

        var closest_intersection = { distance: Number.POSITIVE_INFINITY, ball: null, normal: null }    // An empty intersection object

     
        /// step 1 : using the intersect to find the closest_intersection balls
        for (let b of this.balls)
        {
          var min_dis;
          if(is_primary)
            min_dis = 1;
          else
            min_dis = 0.0001;
          closest_intersection = b.intersect(ray, closest_intersection, min_dis);
        }
        if( !closest_intersection.ball ) return this.color_missed_ray( ray );

        ///////////////////////////////////////decarling variable to get the intersect point///////////////////
        var p = add(ray.origin,scale_vec(closest_intersection.distance,ray.dir));
        var n = closest_intersection.normal.slice(0,3);

        ///////////////////////////////////////calculating the surface color///////////////////////////
        var ambient = scale_vec(closest_intersection.ball.k_a, closest_intersection.ball.color).slice(0,3);
        var s_color = ambient;

        /////////////////////////////////calculating the diffuse and specular lights on the object////////////////
        for (let m of this.lights) // looping all the light sources 
        {
          var l_dir = subtract(m.position, p) 

          var l_ray = { origin:p, dir: l_dir }

          // declaring a empty light intersection object
          var l_ray_intersect = { distance: Number.POSITIVE_INFINITY, ball: null, normal: null } 
          /// looping all the the balls    
          for (let r of this.balls)
            // find the the cloesest light that intersect witht the balls 
            l_ray_intersect = r.intersect(l_ray, l_ray_intersect, 0.001);

          // if we find it , then that means that there is none contribution so we dont proceedd .
          if ( l_ray_intersect.distance >= 0 &&  l_ray_intersect.distance < 1 )  continue;

          // Otherwise, calcuate the diffuse and specular 
          else
          {
            var m_color =  m.color.slice(0,3);
            //calcuting the diffuse effect on the object based on the equation we have
            var l = normalize(subtract(m.position, p).slice(0,3));
            var n_dot_l = dot(n,l);
            var diffuse_light = scale_vec(closest_intersection.ball.k_d * Math.max(n_dot_l, 0), closest_intersection.ball.color.slice(0,3));
            diffuse_light = mult_3_coeffs(diffuse_light,m_color);


            //using the formuala to calculate the specular effect on the object 
            var r = normalize(subtract( scale_vec(n_dot_l*2,n), l ));
            var V = normalize(subtract( ray.origin, p).slice(0,3));
            var r_dot_V = dot(r,V);
            var specular_light = closest_intersection.ball.k_s * Math.pow(Math.max(r_dot_V,0),closest_intersection.ball.n);
            specular_light = scale_vec(specular_light ,m_color);

            // so now we have the diffuse effect and specular effect we can add the surface color to create the final color 
            s_color = add(s_color,add(diffuse_light,specular_light));

           }

        }
        // check the color of the object is between 0 and 1 
        for (var i=0;i<3;i++)
        {
            if (s_color[i] < 0) s_color[i]=0;
            else if (s_color[i] > 1) s_color[i]=1;
        }

        // so once we done the diffuse and specular effect and now we can consider the cases of reflection and 
        // reftraction with the remaining color

        var Color_1111 = subtract(Color(1,1,1,1).slice(0,3), s_color);
        var remaining_color = mult_3_coeffs(color_remaining, Color_1111);


   /////////////////////// reflection//////////////////

        var ray_dirct =ray.dir.slice(0,3);
        // using the formulat to calculate the direction of the relfection ray
        var v = add(scale_vec(-2*dot(n, ray_dirct),n.concat(0)), ray.dir);
        ////find out the reflection ray color /////////////
        var rl_ray_color = scale_vec( closest_intersection.ball.k_r, remaining_color);

       ///// computing the color that contributing by the reflection to the object with recurssion /////////
        var rl_ray = {origin: p, dir: v};
        var rl_reflect_cl = scale_vec(closest_intersection.ball.k_r, this.trace(rl_ray, rl_ray_color, false, null).slice(0,3));
        rl_reflect_cl = mult_3_coeffs(Color_1111,rl_reflect_cl);


        /////////////////////////Refraction/////////////////////////////////////////
        var R = closest_intersection.ball.refract_index;
        // Computing the reftrction ray//////////////
        var L = normalize(ray_dirct);
        var C = -dot(L,n);
        var coeff = R*C - Math.sqrt(1 - Math.pow(R,2) * (1 - Math.pow(C,2)));
        var rf_ray_dir = normalize(add(scale_vec(R,L),scale_vec(coeff,n)));
        var rf_ray_color = scale_vec (closest_intersection.ball.k_refract, remaining_color);


        ///// computing the color that contributing by the reflection to the object with recurssion /////////
        var rf_ray = {origin: p, dir: rf_ray_dir.concat(0) };
        var rf_refract_cl = scale_vec(closest_intersection.ball.k_refract, this.trace(rf_ray, rf_ray_color, false, null).slice(0,3));
        rf_refract_cl = mult_3_coeffs(Color_1111,rf_refract_cl);

        // computing the final color of the surface color with the reflection and reftraction 
        var f_pix_color = add(add(s_color, rl_reflect_cl),rf_refract_cl);

        //return the pixel color
        return f_pix_color.concat(1);
      },
    'parse_line'( tokens )            // Load the lines from the textbox into variables
      { for( let i = 1; i < tokens.length; i++ ) tokens[i] = Number.parseFloat( tokens[i] );
        switch( tokens[0] )
          { case "NEAR":    this.near   = tokens[1];  break;
            case "LEFT":    this.left   = tokens[1];  break;
            case "RIGHT":   this.right  = tokens[1];  break;
            case "BOTTOM":  this.bottom = tokens[1];  break;
            case "TOP":     this.top    = tokens[1];  break;
            case "RES":     this.width             = tokens[1];   this.height            = tokens[2]; 
                            this.scratchpad.width  = this.width;  this.scratchpad.height = this.height; break;
            case "SPHERE":
              this.balls.push( new Ball( [tokens[1], tokens[2], tokens[3]], [tokens[4], tokens[5], tokens[6]], [tokens[7],tokens[8],tokens[9]], 
                                          tokens[10],tokens[11],tokens[12],  tokens[13],tokens[14],tokens[15],  tokens[16] ) ); break;
            case "LIGHT":   this.lights.push( new Light( [ tokens[1],tokens[2],tokens[3], 1 ], Color( tokens[4],tokens[5],tokens[6], 1 ),    10000000 ) ); break;
            case "BACK":    this.background_color = Color( tokens[1],tokens[2],tokens[3], 1 ); this.gl.clearColor.apply( this.gl, this.background_color ); break;
            case "AMBIENT": this.ambient = [tokens[1], tokens[2], tokens[3]];          
          }
      },
    'parse_file'()        // Move through the text lines
      { this.balls = [];   this.lights = [];
        this.scanline = 0; this.scanlines_per_frame = 1;                            // Begin at bottom scanline, forget the last image's speedup factor
        document.getElementById("progress").style = "display:inline-block;";        // Re-show progress bar
        this.camera_needs_reset = true;                                             // Reset camera
        var input_lines = document.getElementById( "input_scene" ).value.split("\n");
        for( let i of input_lines ) this.parse_line( i.split(/\s+/) );
      },
    'load_case'( i ) {   document.getElementById( "input_scene" ).value = test_cases[ i ];   },
    'make_menu'()
      { document.getElementById( "raytracer_menu" ).innerHTML = "<span style='white-space: nowrap'> \
          <button id='toggle_raytracing' class='dropbtn' style='background-color: #AF4C50'>Toggle Ray Tracing</button> \
          <button onclick='document.getElementById(\"myDropdown2\").classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #8A8A4C'> \
          Select Background Effect</button><div  id='myDropdown2' class='dropdown-content'>  </div>\
          <button onclick='document.getElementById(\"myDropdown\" ).classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #4C50AF'> \
          Select Test Case</button        ><div  id='myDropdown' class='dropdown-content'>  </div> \
          <button id='submit_scene' class='dropbtn'>Submit Scene Textbox</button> \
          <div id='progress' style = 'display:none;' ></div></span>";
        for( let i in test_cases )
          { var a = document.createElement( "a" );
            a.addEventListener("click", function() { this.load_case( i ); this.parse_file(); }.bind( this    ), false);
            a.innerHTML = i;
            document.getElementById( "myDropdown"  ).appendChild( a );
          }
        for( let j in this.background_functions )
          { var a = document.createElement( "a" );
            a.addEventListener("click", function() { this.curr_background_function = j;      }.bind( this, j ), false);
            a.innerHTML = j;
            document.getElementById( "myDropdown2" ).appendChild( a );
          }
        
        document.getElementById( "input_scene" ).addEventListener( "keydown", function(event) { event.cancelBubble = true; }, false );
        
        window.addEventListener( "click", function(event) {  if( !event.target.matches('.dropbtn') ) {    
          document.getElementById( "myDropdown"  ).classList.remove("show");
          document.getElementById( "myDropdown2" ).classList.remove("show"); } }, false );

        document.getElementById( "toggle_raytracing" ).addEventListener("click", this.toggle_visible.bind( this ), false);
        document.getElementById( "submit_scene"      ).addEventListener("click", this.parse_file.bind(     this ), false);
      },
    'toggle_visible'() { this.visible = !this.visible; document.getElementById("progress").style = "display:inline-block;" },
    'set_color'( ix, iy, color )                           // Sends a color to one pixel index of our final result
      { var index = iy * this.width + ix;
        this.imageData.data[ 4 * index     ] = 255.9 * color[0];    
        this.imageData.data[ 4 * index + 1 ] = 255.9 * color[1];    
        this.imageData.data[ 4 * index + 2 ] = 255.9 * color[2];    
        this.imageData.data[ 4 * index + 3 ] = 255;  
      },
    'init_keys'( controls ) { controls.add( "SHIFT+r", this, this.toggle_visible ); },
    'display'( graphics_state )
      { graphics_state.lights = this.lights;
        graphics_state.projection_transform = perspective(90, 1, 1, 1000);
        if( this.camera_needs_reset ) { graphics_state.camera_transform = identity(); this.camera_needs_reset = false; }
        
        if( !this.visible )                          // Raster mode, to draw the same shapes out of triangles when you don't want to trace rays
        { for( let b of this.balls ) this.shapes.sphere.draw( graphics_state, b.model_transform, this.shader.material( b.color.concat(1), b.k_a, b.k_d, b.k_s, b.n ) );
          this.scanline = 0;    document.getElementById("progress").style = "display:none";     return; 
        } 
        if( !this.texture || !this.texture.loaded ) return;      // Don't display until we've got our first procedural image
        this.scratchpad_context.drawImage( this.texture.image, 0, 0 );
        this.imageData = this.scratchpad_context.getImageData( 0, 0, this.width, this.height );    // Send the newest pixels over to the texture
        var camera_inv = inverse( graphics_state.camera_transform );
        
        var desired_milliseconds_per_frame = 100;
        if( ! this.scanlines_per_frame ) this.scanlines_per_frame = 1;
        var milliseconds_per_scanline = Math.max( graphics_state.animation_delta_time / this.scanlines_per_frame, 1 );
        this.scanlines_per_frame = desired_milliseconds_per_frame / milliseconds_per_scanline + 1;
        for( var i = 0; i < this.scanlines_per_frame; i++ )     // Update as many scanlines on the picture at once as we can, based on previous frame's speed
        { var y = this.scanline++;
          if( y >= this.height ) { this.scanline = 0; document.getElementById("progress").style = "display:none" };
          document.getElementById("progress").innerHTML = "Rendering ( " + 100 * y / this.height + "% )..."; 
          for ( var x = 0; x < this.width; x++ )
          { var ray = { origin: mult_vec( camera_inv, vec4(0, 0, 0, 1) ), dir: mult_vec( camera_inv, this.get_dir( x, y ) ) };   // Apply camera
            this.set_color( x, y, this.trace( ray, [1,1,1], true ) );                                    // ******** Trace a single ray *********
          }
        }
        this.scratchpad_context.putImageData( this.imageData, 0, 0);          // Draw the image on the hidden canvas
        this.texture.image.src = this.scratchpad.toDataURL("image/png");      // Convert the canvas back into an image and send to a texture
        
        this.shapes.square.draw( new Graphics_State( identity(), identity(), 0 ), translation(0,0,-1), this.shader.material( Color( 0, 0, 0, 1 ), 1,  0, 0, 1, this.texture ) );
      }
  }, Scene_Component );