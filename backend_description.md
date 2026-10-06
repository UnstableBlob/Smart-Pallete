Below is a professional, implementation-ready blueprint you can give to your team or use as the backend/model specification for Smart Palette.
SMART PALETTE – PROFESSIONAL BACKEND AND AI MODEL BLUEPRINT
PROJECT OBJECTIVE
Smart Palette is a multimodal AI cooking assistant that takes an image of a refrigerator, pantry, or kitchen ingredients, identifies visible ingredients, allows the user to correct the detected inventory, and generates recipes according to user-defined constraints.
The core AI pipeline is:
Image
→ Object Detection
→ Ingredient Identification
→ Ingredient Counting
→ User Confirmation
→ Constraint Processing
→ LLM Recipe Generation
→ Recipe Validation
→ Inventory Update
The first implementation should use a pretrained YOLO-World model. YOLO-World supports open-vocabulary object detection, meaning custom object categories can be supplied as text without immediately training a new model. Ultralytics documents custom classes through model.set_classes(...). Ultralytics Docs
HIGH-LEVEL SYSTEM ARCHITECTURE
Existing Frontend
 |
 | Image + User Inputs
 v
FastAPI Backend
 |
 +----------------------+
 | |
 v v
YOLO-World Inventory Database
 |
 v
Ingredient Detection
 |
 v
Ingredient Counting
 |
 v
User Confirmation
 |
 v
Constraint Engine
 |
 v
LLM Recipe Generator
 |
 v
Recipe Validator
 |
 v
Structured Recipe JSON
 |
 v
Existing Frontend
 |
 v
Recipe Completion
 |
 v
Inventory Deduction
RECOMMENDED TECHNOLOGY STACK
Frontend:
Existing frontend
React / Next.js / HTML-CSS-JavaScript depending on the current implementation
Backend:
Python
FastAPI
Uvicorn
Pydantic
Computer Vision:
Ultralytics
YOLO-World
PyTorch
Pillow/OpenCV where required
Database:
SQLite for prototype
PostgreSQL for production
Recipe Generation:
LLM API
Structured JSON output
Authentication:
JWT or the authentication system already used by the frontend, if required
Deployment:
Docker
Cloud server/GPU if required
Alternatively, local GPU/CPU for the college demonstration
Ultralytics officially documents FastAPI-based inference architectures and containerized deployment. Ultralytics Docs
COMPUTER VISION MODEL
MODEL:
YOLO-World
Recommended starting model:
yolov8s-worldv2.pt
Ultralytics specifically recommends YOLOv8-World v2 for custom training and export, while YOLO-World can also be used directly for pretrained inference. Ultralytics Docs
IMPORTANT:
The first version should NOT be trained.
Use the pretrained YOLO-World model and test whether it can recognize the required ingredients accurately enough.
Only fine-tune the model if the pretrained model does not provide sufficient accuracy for Smart Palette.
INGREDIENT VOCABULARY
Start with approximately 15–20 classes.
Recommended initial classes:
egg
tomato
onion
potato
carrot
capsicum
spinach
mushroom
apple
banana
lemon
milk
bread
cheese
paneer
peas
corn
cucumber
garlic
ginger
The list can later be expanded to 30–50 classes.
The vocabulary should be maintained in one configuration file rather than hard-coded throughout the application.
Example:
ingredients.json
{
 "ingredients": [
 "egg",
 "tomato",
 "onion",
 "potato",
 "carrot",
 "capsicum",
 "spinach",
 "mushroom",
 "apple",
 "banana",
 "lemon",
 "milk",
 "bread",
 "cheese",
 "paneer"
 ]
}
YOLO-WORLD OPERATION
The model receives an image.
The application supplies the list of ingredient classes.
Example:
egg
tomato
onion
potato
carrot
milk
bread
paneer
YOLO-World then searches the image for those objects.
For every detected object it provides:
Class name
Confidence score
Bounding box coordinates
Example internal output:
{
 "name": "tomato",
 "confidence": 0.91,
 "bbox": [120, 80, 240, 210]
}
The model can detect multiple classes and multiple instances in the same image.
WHY OBJECT DETECTION IS REQUIRED
Smart Palette should not use simple image classification.
Classification answers:
"What is present in this image?"
Object detection answers:
"Which objects are present, where are they, and how many instances are visible?"
For Smart Palette, detection is required because one image could contain:
4 eggs
2 tomatoes
1 onion
1 carrot
1 milk bottle
2 apples
Therefore, YOLO object detection is appropriate.
INITIAL MODEL TESTING
Before creating a custom dataset, perform an evaluation using the pretrained YOLO-World model.
Test images should represent the actual Smart Palette use case.
Images should include:
Multiple ingredients
Different lighting
Different backgrounds
Ingredients at different distances
Partially occluded ingredients
Multiple instances of the same ingredient
Refrigerator shelves
Pantry shelves
Kitchen counters
Grocery bags
TESTING PHASES
Phase 1:
Test 5 ingredients.
Phase 2:
Test 10 ingredients.
Phase 3:
Test 15–20 ingredients.
Phase 4:
Test crowded images containing many objects.
Phase 5:
Test real refrigerator/pantry images.
For each ingredient record:
Correct detection
Incorrect detection
Missed detection
Confidence
Approximate inference time
DECISION: WHETHER TO TRAIN
After testing, there are two possibilities.
CASE A:
Pretrained YOLO-World provides acceptable performance.
Use the pretrained model directly.
Architecture:
Image
→ YOLO-World
→ Ingredients
→ Counting
→ Backend
CASE B:
Some ingredients are consistently missed or confused.
Then create a custom dataset and fine-tune YOLO-World.
Architecture:
Pretrained YOLO-World
→ Custom Dataset
→ Fine-Tuning
→ Smart Palette YOLO Model
CUSTOM DATASET IF FINE-TUNING IS REQUIRED
The dataset should contain real images of the ingredients that Smart Palette needs to detect.
The dataset should not consist only of isolated studio photographs.
Include:
Refrigerator images
Pantry images
Kitchen images
Multiple ingredients
Different camera angles
Different lighting
Different backgrounds
Different object sizes
Occlusion
Multiple quantities
Example:
One image:
egg
egg
egg
tomato
tomato
onion
carrot
Every object needs its own bounding-box annotation.
DATASET SIZE
For a college project, an initial target can be:
15–20 classes
Approximately:
150–300 images per class
This produces approximately:
2,250–6,000 images
However, the actual required dataset size should be determined by validation performance.
Do not collect thousands of images before establishing that the pretrained model actually requires fine-tuning.
DATA ANNOTATION
Use an object-detection annotation platform such as:
Roboflow
CVAT
Label Studio
Each object receives:
Class
+
Bounding Box
Example:
Image:
Tomato → bounding box
Egg → bounding box
Onion → bounding box
The dataset should then be exported in YOLO-compatible format.
DATASET STRUCTURE
Recommended structure:
smart-palette-dataset/
images/
 train/
 val/
 test/
labels/
 train/
 val/
 test/
data.yaml
Recommended initial split:
70% training
20% validation
10% testing
The test set must contain images that were not used during training.
MODEL TRAINING
If fine-tuning becomes necessary:
Load:
yolov8s-worldv2.pt
Then train it using the custom dataset.
Conceptually:
Pretrained Model
+
Smart Palette Dataset
→
Fine-Tuned Smart Palette Model
Ultralytics provides training support for YOLO-World and specifically recommends YOLOv8-World v2 for custom training/export. Ultralytics Docs
The training configuration should record:
Model version
Dataset version
Number of classes
Number of images
Epochs
Batch size
Image size
Hardware
Training duration
MODEL EVALUATION
The vision model should be evaluated using:
Precision
Recall
mAP@50
mAP@50-95
Confusion Matrix
Inference time
Do not put assumed accuracy values in the project report.
Use the actual values obtained from the trained/tested model.
BACKEND ARCHITECTURE
Use FastAPI as the main backend framework.
Recommended structure:
backend/
app/
 main.py
api/
    detection.py
    recipe.py
    inventory.py

services/
    detector.py
    counting.py
    recipe_generator.py
    recipe_validator.py
    inventory_service.py
    constraint_engine.py

models/
    yolov8s-worldv2.pt

schemas/
    detection.py
    recipe.py
    inventory.py

database/
    database.py
    models.py

config/
    ingredients.json
requirements.txt
.env
RESPONSIBILITY OF EACH BACKEND COMPONENT
main.py
Starts the FastAPI application.
detection.py
Handles image-upload and detection API requests.
detector.py
Loads YOLO-World and performs inference.
counting.py
Converts individual detections into ingredient counts.
constraint_engine.py
Checks dietary, allergy, serving, budget, and time constraints.
recipe_generator.py
Communicates with the LLM.
recipe_validator.py
Checks whether the generated recipe follows the confirmed inventory and constraints.
inventory_service.py
Reads and updates ingredient quantities.
database.py
Manages database connections.
MODEL LOADING
The YOLO model should be loaded ONCE when the backend starts.
Do NOT load the model every time a user sends an image.
Correct:
Backend starts
→ Load YOLO model into memory
→ Wait for requests
→ Perform inference
Incorrect:
Request arrives
→ Load model
→ Run model
→ Delete model
→ Next request
→ Load model again
Loading once reduces unnecessary latency.
DETECTION API
Create:
POST /api/v1/detect
Input:
multipart/form-data
Field:
image
Optional parameters:
confidence threshold
Example request:
POST /api/v1/detect
image = fridge.jpg
DETECTION API RESPONSE
The response should be structured JSON.
Example:
{
 "success": true,
 "ingredients": [
 {
 "name": "egg",
 "count": 4,
 "confidence": 0.91
 },
 {
 "name": "tomato",
 "count": 2,
 "confidence": 0.88
 },
 {
 "name": "onion",
 "count": 1,
 "confidence": 0.84
 }
 ]
}
DETECTION PROCESS
The backend should execute:
Receive image.
Validate file type.
Resize/preprocess if required.
Send image to YOLO-World.
Receive bounding boxes.
Filter low-confidence detections.
Map class IDs to ingredient names.
Count individual detections.
Generate JSON.
Return JSON to frontend.
The original image should not be permanently stored unless the application requires it.
CONFIDENCE THRESHOLD
The model produces confidence scores.
Example:
Tomato = 0.92
Egg = 0.88
Onion = 0.41
You can initially use a threshold such as:
0.25–0.50
but the final threshold should be determined experimentally.
Do not assume that 0.50 is automatically optimal.
The threshold should be configurable through backend configuration.
MANUAL CORRECTION
Computer vision will not always be correct.
Therefore, the frontend should show:
Detected Ingredients
Egg × 4
Tomato × 2
Onion × 1
Then provide:
Remove
Edit quantity
Add ingredient
Example:
Detected:
Egg × 4
User changes it to:
Egg × 6
This creates a confirmed inventory state.
The LLM should receive the CONFIRMED inventory, not blindly trust the raw YOLO output.
CONFIRMED INVENTORY
The system should maintain two states:
Raw Detection
What YOLO saw.
Confirmed Inventory
What the user approved/corrected.
Example:
Raw:
egg = 4
tomato = 2
User adds:
garlic = 1
Confirmed:
egg = 4
tomato = 2
garlic = 1
Only the confirmed state should be sent to the recipe-generation system.
USER CONSTRAINTS
The frontend should send:
Servings
Diet
Allergies
Maximum preparation time
Budget
Optional cuisine preference
Example:
{
 "servings": 2,
 "diet": "vegetarian",
 "allergies": ["peanut"],
 "max_time_minutes": 20,
 "budget": "low"
}
CONSTRAINT ENGINE
Before sending the request to the LLM, validate the constraints.
Example:
User:
Diet = Vegan
The system must ensure the recipe does not contain:
Egg
Milk
Cheese
Paneer
Chicken
Similarly, allergies should be treated as hard constraints.
This layer should not rely solely on the LLM.
LLM RECIPE GENERATION
The LLM receives:
Confirmed Inventory
+
User Constraints
+
Optional Perishability Information
Example:
Inventory:
Egg: 4
Tomato: 2
Bread: 4
Spinach: 1
Constraints:
Servings: 2
Diet: Vegetarian
Time: 20 minutes
Budget: Low
LLM SYSTEM INSTRUCTION
The recipe generator should be instructed to:
Use confirmed inventory.
Respect dietary restrictions.
Respect allergies.
Respect serving size.
Respect maximum preparation time.
Prefer high-perishability ingredients.
Avoid inventing primary ingredients.
Return structured JSON.
Clearly identify optional ingredients if they are allowed.
RECIPE OUTPUT FORMAT
Example:
{
 "title": "Spinach Tomato Egg Toast",
 "servings": 2,
 "preparation_time_minutes": 15,
"ingredients": [
    {
        "name": "egg",
        "quantity": 2
    },
    {
        "name": "tomato",
        "quantity": 1
    },
    {
        "name": "spinach",
        "quantity": 1
    },
    {
        "name": "bread",
        "quantity": 2
    }
],

"steps": [
    "Wash and chop the vegetables.",
    "Beat the eggs.",
    "Cook the vegetables and eggs.",
    "Toast the bread.",
    "Serve."
]
}
RECIPE VALIDATION
The generated recipe should pass through a validation layer.
Check:
Are all required primary ingredients available?
Does the recipe violate dietary restrictions?
Does it contain an allergen?
Does it exceed the requested preparation time?
Does the serving size match?
Are ingredient quantities valid?
Are unapproved primary ingredients introduced?
If validation fails:
Regenerate the recipe or ask the user for permission to add the missing ingredient.
INVENTORY DATABASE
Use SQLite for the college prototype.
Move to PostgreSQL if the project becomes a production application.
Example inventory record:
{
 "ingredient": "tomato",
 "quantity": 2,
 "unit": "pieces",
 "expiry_date": "2026-09-25",
 "perishability": "high"
}
INVENTORY UPDATE
Initial:
Egg: 4
Tomato: 2
Bread: 4
Recipe consumes:
Egg: 2
Tomato: 1
Bread: 2
Updated:
Egg: 2
Tomato: 1
Bread: 2
ZERO-WASTE MODULE
The inventory system should store:
Ingredient
Quantity
Unit
Expiry date
Perishability
The system calculates which ingredients should be prioritized.
Example:
Spinach → High perishability
Milk → High perishability
Strawberry → High perishability
Potato → Medium/Low
Rice → Low
When multiple recipes are possible, the recipe generator should prioritize suitable ingredients that are closer to expiry.
FRONTEND INTEGRATION
The existing frontend does NOT need to contain the YOLO model.
The frontend communicates with the FastAPI backend.
Architecture:
Existing Frontend
 |
 | POST /api/v1/detect
 v
FastAPI
 |
 v
YOLO-World
 |
 v
JSON
 |
 v
Frontend
FRONTEND API FLOW
User clicks:
SCAN INGREDIENTS
Frontend:
Reads selected image.
Creates FormData.
Sends image to backend.
Waits for response.
Receives ingredient JSON.
Displays detected ingredients.
Allows user correction.
Sends confirmed inventory to recipe endpoint.
RECIPE API
Create:
POST /api/v1/recipes/generate
Request:
{
 "inventory": [
 {
 "name": "egg",
 "quantity": 4
 },
 {
 "name": "tomato",
 "quantity": 2
 }
 ],
 "servings": 2,
 "diet": "vegetarian",
 "allergies": [],
 "max_time_minutes": 20,
 "budget": "low"
}
INVENTORY APIs
Recommended endpoints:
GET /api/v1/inventory
POST /api/v1/inventory
PUT /api/v1/inventory/{id}
DELETE /api/v1/inventory/{id}
POST /api/v1/inventory/consume
This keeps inventory management separate from AI inference.
COMPLETE API DESIGN
POST /api/v1/detect
Purpose:
Detect ingredients from image.
POST /api/v1/inventory/confirm
Purpose:
Save user-confirmed detection results.
GET /api/v1/inventory
Purpose:
Retrieve current inventory.
POST /api/v1/recipes/generate
Purpose:
Generate recipe using inventory and constraints.
POST /api/v1/recipes/validate
Purpose:
Validate generated recipe.
POST /api/v1/inventory/consume
Purpose:
Deduct ingredients after recipe completion.
RECOMMENDED DEVELOPMENT PHASES
PHASE 1 – MODEL PROTOTYPE
Install Ultralytics.
Load YOLO-World.
Create 15–20 ingredient classes.
Test real images.
Measure detection quality.
Do not train yet.
PHASE 2 – MODEL DECISION
If pretrained YOLO-World works:
Keep it.
If it does not work:
Create custom dataset.
Annotate.
Fine-tune YOLO-World.
Evaluate again.
PHASE 3 – BACKEND
Build FastAPI.
Load YOLO once.
Create /detect endpoint.
Return structured JSON.
PHASE 4 – FRONTEND INTEGRATION
Connect existing upload interface to /detect.
Display detections.
Add manual correction.
Save confirmed inventory.
PHASE 5 – LLM
Create recipe-generation service.
Send confirmed inventory + constraints.
Receive structured recipe JSON.
Display recipe.
PHASE 6 – VALIDATION
Implement ingredient validation.
Implement dietary validation.
Implement allergy validation.
Implement serving/time validation.
PHASE 7 – INVENTORY
Create database.
Store inventory.
Deduct consumed ingredients.
Track expiry.
PHASE 8 – ZERO WASTE
Calculate perishability.
Prioritize ingredients close to expiry.
Pass priority information to recipe generation.
RECOMMENDED FINAL PROJECT STRUCTURE
smart-palette/
frontend/
backend/
app/
    main.py

    api/
        detection.py
        inventory.py
        recipes.py

    services/
        detector.py
        counting.py
        constraint_engine.py
        recipe_generator.py
        recipe_validator.py
        inventory_service.py

    models/
        yolov8s-worldv2.pt

    schemas/
        detection.py
        inventory.py
        recipe.py

    database/
        database.py
        models.py

    config/
        ingredients.json

tests/

requirements.txt

.env

Dockerfile
README.md
MODEL DEPLOYMENT
For the college prototype, run the model directly inside the Python backend.
For example:
Frontend
→ FastAPI
→ YOLO-World
→ JSON
If deployment later requires scaling, containerize the backend using Docker and deploy it on a cloud service with suitable CPU/GPU resources. Ultralytics documents FastAPI and Docker-based inference deployment patterns. Ultralytics Docs
For local development, the native PyTorch .pt model is the simplest format. Ultralytics also supports exporting models to deployment formats such as ONNX and TensorRT when required. Ultralytics Docs
HARDWARE
For initial pretrained inference:
CPU:
Possible for testing, but slower.
GPU:
Recommended for faster inference.
For fine-tuning:
NVIDIA GPU with CUDA is strongly preferable.
Google Colab can be used for training if local GPU resources are insufficient.
SECURITY
Do not put LLM API keys or other secret credentials in the frontend.
Incorrect:
Frontend
→ LLM API directly
Correct:
Frontend
→ Backend
→ LLM API
Store secrets in:
.env
Example:
LLM_API_KEY=your_key_here
Never commit .env to GitHub.
ERROR HANDLING
The backend should handle:
Invalid image
Unsupported file type
Image too large
No ingredients detected
Low-confidence detection
LLM failure
Invalid LLM response
Database failure
Missing inventory
Recipe validation failure
Example:
{
 "success": false,
 "error": {
 "code": "NO_INGREDIENTS_DETECTED",
 "message": "No supported ingredients were detected."
 }
}
LOGGING
Record:
Request ID
Inference time
Number of detections
Model version
API response time
Errors
Do NOT unnecessarily store users' food images permanently.
For a college project, basic application logs are sufficient.
TESTING STRATEGY
MODEL TESTING
Test:
Single ingredient
Multiple ingredients
Multiple instances
Occlusion
Different lighting
Different backgrounds
Crowded refrigerator
Low-quality image
BACKEND TESTING
Test:
Valid image
Invalid image
Large image
No detection
Multiple detections
API timeout
LLM TESTING
Test:
Vegetarian
Vegan
Allergy
Different serving sizes
Different time limits
Limited inventory
Perishable ingredients
END-TO-END TEST
Image
→ YOLO
→ Ingredients
→ User correction
→ Inventory
→ Constraints
→ LLM
→ Validation
→ Recipe
→ Consumption
→ Updated inventory
MOST IMPORTANT DESIGN PRINCIPLE
Separate AI from application logic.
AI:
YOLO-World
LLM
Application logic:
Counting
Inventory
Authentication
Database
Constraints
Validation
API
Frontend
This makes the system easier to develop, test, debug, and explain during your Artificial Intelligence project viva.
WHAT ACTUALLY NEEDS TRAINING
Initial implementation:
YOLO-World:
Pretrained – NO TRAINING
LLM:
Pretrained API – NO TRAINING
Counting:
Normal programming – NO TRAINING
Constraint engine:
Rules – NO TRAINING
Inventory:
Database – NO TRAINING
Recipe validator:
Rules + LLM validation – NO TRAINING
Therefore, your first complete prototype can be built without training a model.
If testing demonstrates insufficient ingredient-detection performance, then only the YOLO component is fine-tuned using your custom food dataset.
FINAL PROFESSIONAL ARCHITECTURE
         SMART PALETTE
               |
               v
      EXISTING FRONTEND
               |
      +--------+--------+
      |                 |
 Image Upload      User Constraints
      |                 |
      +--------+--------+
               |
               v
         FASTAPI BACKEND
               |
      +--------+--------+
      |                 |
      v                 v
 YOLO-WORLD         INVENTORY DB
      |
      v
 OBJECT DETECTION
 |
 v
 INGREDIENT COUNTING
 |
 v
 USER CONFIRMATION
 |
 v
 CONFIRMED INVENTORY
 |
 v
 CONSTRAINT ENGINE
 |
 v
LLM RECIPE ENGINE
 |
 v
 STRUCTURED RECIPE JSON
 |
 v
RECIPE VALIDATOR
 |
 v
EXISTING FRONTEND
 |
 v
 USER COOKS
 |
 v
 INVENTORY CONSUMPTION
 |
 v
 UPDATED INVENTORY
 |
 v
 ZERO-WASTE PRIORITY
IMMEDIATE IMPLEMENTATION ORDER
Your team should now work in this exact sequence:
Finalize the 15–20 ingredient vocabulary.
Install Python and Ultralytics.
Run pretrained YOLO-World.
Test it on real Smart Palette images.
Check whether it correctly differentiates the ingredients.
Add counting.
Generate structured JSON.
Decide whether fine-tuning is necessary.
If necessary, build and annotate the custom dataset.
Fine-tune YOLO-World.
Build the FastAPI backend.
Put the model inside the backend.
Create POST /api/v1/detect.
Connect the existing frontend to the endpoint.
Add manual correction.
Add inventory database.
Add constraint engine.
Add LLM recipe generation.
Add recipe validation.
Add inventory consumption.
Add expiry/perishability logic.
Perform complete end-to-end testing.
Deploy the final system.
This gives you a clean separation between the AI model, backend, database, LLM, and existing frontend, while keeping the initial implementation realistic: use pretrained YOLO-World first, and only train/fine-tune if your actual test images show that it is necessary. Ultralytics' current documentation supports the pretrained YOLO-World workflow, custom vocabularies, fine-tuning, and deployment through Python-based applications. Ultralytics Docs
Would you like this blueprint turned into a formal software requirements document or a system architecture document next?
Below is a professional, implementation-ready blueprint you can give to your team or use as the backend/model specification for Smart Palette.
SMART PALETTE – PROFESSIONAL BACKEND AND AI MODEL BLUEPRINT
PROJECT OBJECTIVE
Smart Palette is a multimodal AI cooking assistant that takes an image of a refrigerator, pantry, or kitchen ingredients, identifies visible ingredients, allows the user to correct the detected inventory, and generates recipes according to user-defined constraints.
The core AI pipeline is:
Image
→ Object Detection
→ Ingredient Identification
→ Ingredient Counting
→ User Confirmation
→ Constraint Processing
→ LLM Recipe Generation
→ Recipe Validation
→ Inventory Update
The first implementation should use a pretrained YOLO-World model. YOLO-World supports open-vocabulary object detection, meaning custom object categories can be supplied as text without immediately training a new model. Ultralytics documents custom classes through model.set_classes(...). Ultralytics Docs
HIGH-LEVEL SYSTEM ARCHITECTURE
Existing Frontend
 |
 | Image + User Inputs
 v
FastAPI Backend
 |
 +----------------------+
 | |
 v v
YOLO-World Inventory Database
 |
 v
Ingredient Detection
 |
 v
Ingredient Counting
 |
 v
User Confirmation
 |
 v
Constraint Engine
 |
 v
LLM Recipe Generator
 |
 v
Recipe Validator
 |
 v
Structured Recipe JSON
 |
 v
Existing Frontend
 |
 v
Recipe Completion
 |
 v
Inventory Deduction
RECOMMENDED TECHNOLOGY STACK
Frontend:
Existing frontend
React / Next.js / HTML-CSS-JavaScript depending on the current implementation
Backend:
Python
FastAPI
Uvicorn
Pydantic
Computer Vision:
Ultralytics
YOLO-World
PyTorch
Pillow/OpenCV where required
Database:
SQLite for prototype
PostgreSQL for production
Recipe Generation:
LLM API
Structured JSON output
Authentication:
JWT or the authentication system already used by the frontend, if required
Deployment:
Docker
Cloud server/GPU if required
Alternatively, local GPU/CPU for the college demonstration
Ultralytics officially documents FastAPI-based inference architectures and containerized deployment. Ultralytics Docs
COMPUTER VISION MODEL
MODEL:
YOLO-World
Recommended starting model:
yolov8s-worldv2.pt
Ultralytics specifically recommends YOLOv8-World v2 for custom training and export, while YOLO-World can also be used directly for pretrained inference. Ultralytics Docs
IMPORTANT:
The first version should NOT be trained.
Use the pretrained YOLO-World model and test whether it can recognize the required ingredients accurately enough.
Only fine-tune the model if the pretrained model does not provide sufficient accuracy for Smart Palette.
INGREDIENT VOCABULARY
Start with approximately 15–20 classes.
Recommended initial classes:
egg
tomato
onion
potato
carrot
capsicum
spinach
mushroom
apple
banana
lemon
milk
bread
cheese
paneer
peas
corn
cucumber
garlic
ginger
The list can later be expanded to 30–50 classes.
The vocabulary should be maintained in one configuration file rather than hard-coded throughout the application.
Example:
ingredients.json
{
 "ingredients": [
 "egg",
 "tomato",
 "onion",
 "potato",
 "carrot",
 "capsicum",
 "spinach",
 "mushroom",
 "apple",
 "banana",
 "lemon",
 "milk",
 "bread",
 "cheese",
 "paneer"
 ]
}
YOLO-WORLD OPERATION
The model receives an image.
The application supplies the list of ingredient classes.
Example:
egg
tomato
onion
potato
carrot
milk
bread
paneer
YOLO-World then searches the image for those objects.
For every detected object it provides:
Class name
Confidence score
Bounding box coordinates
Example internal output:
{
 "name": "tomato",
 "confidence": 0.91,
 "bbox": [120, 80, 240, 210]
}
The model can detect multiple classes and multiple instances in the same image.
WHY OBJECT DETECTION IS REQUIRED
Smart Palette should not use simple image classification.
Classification answers:
"What is present in this image?"
Object detection answers:
"Which objects are present, where are they, and how many instances are visible?"
For Smart Palette, detection is required because one image could contain:
4 eggs
2 tomatoes
1 onion
1 carrot
1 milk bottle
2 apples
Therefore, YOLO object detection is appropriate.
INITIAL MODEL TESTING
Before creating a custom dataset, perform an evaluation using the pretrained YOLO-World model.
Test images should represent the actual Smart Palette use case.
Images should include:
Multiple ingredients
Different lighting
Different backgrounds
Ingredients at different distances
Partially occluded ingredients
Multiple instances of the same ingredient
Refrigerator shelves
Pantry shelves
Kitchen counters
Grocery bags
TESTING PHASES
Phase 1:
Test 5 ingredients.
Phase 2:
Test 10 ingredients.
Phase 3:
Test 15–20 ingredients.
Phase 4:
Test crowded images containing many objects.
Phase 5:
Test real refrigerator/pantry images.
For each ingredient record:
Correct detection
Incorrect detection
Missed detection
Confidence
Approximate inference time
DECISION: WHETHER TO TRAIN
After testing, there are two possibilities.
CASE A:
Pretrained YOLO-World provides acceptable performance.
Use the pretrained model directly.
Architecture:
Image
→ YOLO-World
→ Ingredients
→ Counting
→ Backend
CASE B:
Some ingredients are consistently missed or confused.
Then create a custom dataset and fine-tune YOLO-World.
Architecture:
Pretrained YOLO-World
→ Custom Dataset
→ Fine-Tuning
→ Smart Palette YOLO Model
CUSTOM DATASET IF FINE-TUNING IS REQUIRED
The dataset should contain real images of the ingredients that Smart Palette needs to detect.
The dataset should not consist only of isolated studio photographs.
Include:
Refrigerator images
Pantry images
Kitchen images
Multiple ingredients
Different camera angles
Different lighting
Different backgrounds
Different object sizes
Occlusion
Multiple quantities
Example:
One image:
egg
egg
egg
tomato
tomato
onion
carrot
Every object needs its own bounding-box annotation.
DATASET SIZE
For a college project, an initial target can be:
15–20 classes
Approximately:
150–300 images per class
This produces approximately:
2,250–6,000 images
However, the actual required dataset size should be determined by validation performance.
Do not collect thousands of images before establishing that the pretrained model actually requires fine-tuning.
DATA ANNOTATION
Use an object-detection annotation platform such as:
Roboflow
CVAT
Label Studio
Each object receives:
Class
+
Bounding Box
Example:
Image:
Tomato → bounding box
Egg → bounding box
Onion → bounding box
The dataset should then be exported in YOLO-compatible format.
DATASET STRUCTURE
Recommended structure:
smart-palette-dataset/
images/
 train/
 val/
 test/
labels/
 train/
 val/
 test/
data.yaml
Recommended initial split:
70% training
20% validation
10% testing
The test set must contain images that were not used during training.
MODEL TRAINING
If fine-tuning becomes necessary:
Load:
yolov8s-worldv2.pt
Then train it using the custom dataset.
Conceptually:
Pretrained Model
+
Smart Palette Dataset
→
Fine-Tuned Smart Palette Model
Ultralytics provides training support for YOLO-World and specifically recommends YOLOv8-World v2 for custom training/export. Ultralytics Docs
The training configuration should record:
Model version
Dataset version
Number of classes
Number of images
Epochs
Batch size
Image size
Hardware
Training duration
MODEL EVALUATION
The vision model should be evaluated using:
Precision
Recall
mAP@50
mAP@50-95
Confusion Matrix
Inference time
Do not put assumed accuracy values in the project report.
Use the actual values obtained from the trained/tested model.
BACKEND ARCHITECTURE
Use FastAPI as the main backend framework.
Recommended structure:
backend/
app/
 main.py
api/
    detection.py
    recipe.py
    inventory.py

services/
    detector.py
    counting.py
    recipe_generator.py
    recipe_validator.py
    inventory_service.py
    constraint_engine.py

models/
    yolov8s-worldv2.pt

schemas/
    detection.py
    recipe.py
    inventory.py

database/
    database.py
    models.py

config/
    ingredients.json
requirements.txt
.env
RESPONSIBILITY OF EACH BACKEND COMPONENT
main.py
Starts the FastAPI application.
detection.py
Handles image-upload and detection API requests.
detector.py
Loads YOLO-World and performs inference.
counting.py
Converts individual detections into ingredient counts.
constraint_engine.py
Checks dietary, allergy, serving, budget, and time constraints.
recipe_generator.py
Communicates with the LLM.
recipe_validator.py
Checks whether the generated recipe follows the confirmed inventory and constraints.
inventory_service.py
Reads and updates ingredient quantities.
database.py
Manages database connections.
MODEL LOADING
The YOLO model should be loaded ONCE when the backend starts.
Do NOT load the model every time a user sends an image.
Correct:
Backend starts
→ Load YOLO model into memory
→ Wait for requests
→ Perform inference
Incorrect:
Request arrives
→ Load model
→ Run model
→ Delete model
→ Next request
→ Load model again
Loading once reduces unnecessary latency.
DETECTION API
Create:
POST /api/v1/detect
Input:
multipart/form-data
Field:
image
Optional parameters:
confidence threshold
Example request:
POST /api/v1/detect
image = fridge.jpg
DETECTION API RESPONSE
The response should be structured JSON.
Example:
{
 "success": true,
 "ingredients": [
 {
 "name": "egg",
 "count": 4,
 "confidence": 0.91
 },
 {
 "name": "tomato",
 "count": 2,
 "confidence": 0.88
 },
 {
 "name": "onion",
 "count": 1,
 "confidence": 0.84
 }
 ]
}
DETECTION PROCESS
The backend should execute:
Receive image.
Validate file type.
Resize/preprocess if required.
Send image to YOLO-World.
Receive bounding boxes.
Filter low-confidence detections.
Map class IDs to ingredient names.
Count individual detections.
Generate JSON.
Return JSON to frontend.
The original image should not be permanently stored unless the application requires it.
CONFIDENCE THRESHOLD
The model produces confidence scores.
Example:
Tomato = 0.92
Egg = 0.88
Onion = 0.41
You can initially use a threshold such as:
0.25–0.50
but the final threshold should be determined experimentally.
Do not assume that 0.50 is automatically optimal.
The threshold should be configurable through backend configuration.
MANUAL CORRECTION
Computer vision will not always be correct.
Therefore, the frontend should show:
Detected Ingredients
Egg × 4
Tomato × 2
Onion × 1
Then provide:
Remove
Edit quantity
Add ingredient
Example:
Detected:
Egg × 4
User changes it to:
Egg × 6
This creates a confirmed inventory state.
The LLM should receive the CONFIRMED inventory, not blindly trust the raw YOLO output.
CONFIRMED INVENTORY
The system should maintain two states:
Raw Detection
What YOLO saw.
Confirmed Inventory
What the user approved/corrected.
Example:
Raw:
egg = 4
tomato = 2
User adds:
garlic = 1
Confirmed:
egg = 4
tomato = 2
garlic = 1
Only the confirmed state should be sent to the recipe-generation system.
USER CONSTRAINTS
The frontend should send:
Servings
Diet
Allergies
Maximum preparation time
Budget
Optional cuisine preference
Example:
{
 "servings": 2,
 "diet": "vegetarian",
 "allergies": ["peanut"],
 "max_time_minutes": 20,
 "budget": "low"
}
CONSTRAINT ENGINE
Before sending the request to the LLM, validate the constraints.
Example:
User:
Diet = Vegan
The system must ensure the recipe does not contain:
Egg
Milk
Cheese
Paneer
Chicken
Similarly, allergies should be treated as hard constraints.
This layer should not rely solely on the LLM.
LLM RECIPE GENERATION
The LLM receives:
Confirmed Inventory
+
User Constraints
+
Optional Perishability Information
Example:
Inventory:
Egg: 4
Tomato: 2
Bread: 4
Spinach: 1
Constraints:
Servings: 2
Diet: Vegetarian
Time: 20 minutes
Budget: Low
LLM SYSTEM INSTRUCTION
The recipe generator should be instructed to:
Use confirmed inventory.
Respect dietary restrictions.
Respect allergies.
Respect serving size.
Respect maximum preparation time.
Prefer high-perishability ingredients.
Avoid inventing primary ingredients.
Return structured JSON.
Clearly identify optional ingredients if they are allowed.
RECIPE OUTPUT FORMAT
Example:
{
 "title": "Spinach Tomato Egg Toast",
 "servings": 2,
 "preparation_time_minutes": 15,
"ingredients": [
    {
        "name": "egg",
        "quantity": 2
    },
    {
        "name": "tomato",
        "quantity": 1
    },
    {
        "name": "spinach",
        "quantity": 1
    },
    {
        "name": "bread",
        "quantity": 2
    }
],

"steps": [
    "Wash and chop the vegetables.",
    "Beat the eggs.",
    "Cook the vegetables and eggs.",
    "Toast the bread.",
    "Serve."
]
}
RECIPE VALIDATION
The generated recipe should pass through a validation layer.
Check:
Are all required primary ingredients available?
Does the recipe violate dietary restrictions?
Does it contain an allergen?
Does it exceed the requested preparation time?
Does the serving size match?
Are ingredient quantities valid?
Are unapproved primary ingredients introduced?
If validation fails:
Regenerate the recipe or ask the user for permission to add the missing ingredient.
INVENTORY DATABASE
Use SQLite for the college prototype.
Move to PostgreSQL if the project becomes a production application.
Example inventory record:
{
 "ingredient": "tomato",
 "quantity": 2,
 "unit": "pieces",
 "expiry_date": "2026-09-25",
 "perishability": "high"
}
INVENTORY UPDATE
Initial:
Egg: 4
Tomato: 2
Bread: 4
Recipe consumes:
Egg: 2
Tomato: 1
Bread: 2
Updated:
Egg: 2
Tomato: 1
Bread: 2
ZERO-WASTE MODULE
The inventory system should store:
Ingredient
Quantity
Unit
Expiry date
Perishability
The system calculates which ingredients should be prioritized.
Example:
Spinach → High perishability
Milk → High perishability
Strawberry → High perishability
Potato → Medium/Low
Rice → Low
When multiple recipes are possible, the recipe generator should prioritize suitable ingredients that are closer to expiry.
FRONTEND INTEGRATION
The existing frontend does NOT need to contain the YOLO model.
The frontend communicates with the FastAPI backend.
Architecture:
Existing Frontend
 |
 | POST /api/v1/detect
 v
FastAPI
 |
 v
YOLO-World
 |
 v
JSON
 |
 v
Frontend
FRONTEND API FLOW
User clicks:
SCAN INGREDIENTS
Frontend:
Reads selected image.
Creates FormData.
Sends image to backend.
Waits for response.
Receives ingredient JSON.
Displays detected ingredients.
Allows user correction.
Sends confirmed inventory to recipe endpoint.
RECIPE API
Create:
POST /api/v1/recipes/generate
Request:
{
 "inventory": [
 {
 "name": "egg",
 "quantity": 4
 },
 {
 "name": "tomato",
 "quantity": 2
 }
 ],
 "servings": 2,
 "diet": "vegetarian",
 "allergies": [],
 "max_time_minutes": 20,
 "budget": "low"
}
INVENTORY APIs
Recommended endpoints:
GET /api/v1/inventory
POST /api/v1/inventory
PUT /api/v1/inventory/{id}
DELETE /api/v1/inventory/{id}
POST /api/v1/inventory/consume
This keeps inventory management separate from AI inference.
COMPLETE API DESIGN
POST /api/v1/detect
Purpose:
Detect ingredients from image.
POST /api/v1/inventory/confirm
Purpose:
Save user-confirmed detection results.
GET /api/v1/inventory
Purpose:
Retrieve current inventory.
POST /api/v1/recipes/generate
Purpose:
Generate recipe using inventory and constraints.
POST /api/v1/recipes/validate
Purpose:
Validate generated recipe.
POST /api/v1/inventory/consume
Purpose:
Deduct ingredients after recipe completion.
RECOMMENDED DEVELOPMENT PHASES
PHASE 1 – MODEL PROTOTYPE
Install Ultralytics.
Load YOLO-World.
Create 15–20 ingredient classes.
Test real images.
Measure detection quality.
Do not train yet.
PHASE 2 – MODEL DECISION
If pretrained YOLO-World works:
Keep it.
If it does not work:
Create custom dataset.
Annotate.
Fine-tune YOLO-World.
Evaluate again.
PHASE 3 – BACKEND
Build FastAPI.
Load YOLO once.
Create /detect endpoint.
Return structured JSON.
PHASE 4 – FRONTEND INTEGRATION
Connect existing upload interface to /detect.
Display detections.
Add manual correction.
Save confirmed inventory.
PHASE 5 – LLM
Create recipe-generation service.
Send confirmed inventory + constraints.
Receive structured recipe JSON.
Display recipe.
PHASE 6 – VALIDATION
Implement ingredient validation.
Implement dietary validation.
Implement allergy validation.
Implement serving/time validation.
PHASE 7 – INVENTORY
Create database.
Store inventory.
Deduct consumed ingredients.
Track expiry.
PHASE 8 – ZERO WASTE
Calculate perishability.
Prioritize ingredients close to expiry.
Pass priority information to recipe generation.
RECOMMENDED FINAL PROJECT STRUCTURE
smart-palette/
frontend/
backend/
app/
    main.py

    api/
        detection.py
        inventory.py
        recipes.py

    services/
        detector.py
        counting.py
        constraint_engine.py
        recipe_generator.py
        recipe_validator.py
        inventory_service.py

    models/
        yolov8s-worldv2.pt

    schemas/
        detection.py
        inventory.py
        recipe.py

    database/
        database.py
        models.py

    config/
        ingredients.json

tests/

requirements.txt

.env

Dockerfile
README.md
MODEL DEPLOYMENT
For the college prototype, run the model directly inside the Python backend.
For example:
Frontend
→ FastAPI
→ YOLO-World
→ JSON
If deployment later requires scaling, containerize the backend using Docker and deploy it on a cloud service with suitable CPU/GPU resources. Ultralytics documents FastAPI and Docker-based inference deployment patterns. Ultralytics Docs
For local development, the native PyTorch .pt model is the simplest format. Ultralytics also supports exporting models to deployment formats such as ONNX and TensorRT when required. Ultralytics Docs
HARDWARE
For initial pretrained inference:
CPU:
Possible for testing, but slower.
GPU:
Recommended for faster inference.
For fine-tuning:
NVIDIA GPU with CUDA is strongly preferable.
Google Colab can be used for training if local GPU resources are insufficient.
SECURITY
Do not put LLM API keys or other secret credentials in the frontend.
Incorrect:
Frontend
→ LLM API directly
Correct:
Frontend
→ Backend
→ LLM API
Store secrets in:
.env
Example:
LLM_API_KEY=your_key_here
Never commit .env to GitHub.
ERROR HANDLING
The backend should handle:
Invalid image
Unsupported file type
Image too large
No ingredients detected
Low-confidence detection
LLM failure
Invalid LLM response
Database failure
Missing inventory
Recipe validation failure
Example:
{
 "success": false,
 "error": {
 "code": "NO_INGREDIENTS_DETECTED",
 "message": "No supported ingredients were detected."
 }
}
LOGGING
Record:
Request ID
Inference time
Number of detections
Model version
API response time
Errors
Do NOT unnecessarily store users' food images permanently.
For a college project, basic application logs are sufficient.
TESTING STRATEGY
MODEL TESTING
Test:
Single ingredient
Multiple ingredients
Multiple instances
Occlusion
Different lighting
Different backgrounds
Crowded refrigerator
Low-quality image
BACKEND TESTING
Test:
Valid image
Invalid image
Large image
No detection
Multiple detections
API timeout
LLM TESTING
Test:
Vegetarian
Vegan
Allergy
Different serving sizes
Different time limits
Limited inventory
Perishable ingredients
END-TO-END TEST
Image
→ YOLO
→ Ingredients
→ User correction
→ Inventory
→ Constraints
→ LLM
→ Validation
→ Recipe
→ Consumption
→ Updated inventory
MOST IMPORTANT DESIGN PRINCIPLE
Separate AI from application logic.
AI:
YOLO-World
LLM
Application logic:
Counting
Inventory
Authentication
Database
Constraints
Validation
API
Frontend
This makes the system easier to develop, test, debug, and explain during your Artificial Intelligence project viva.
WHAT ACTUALLY NEEDS TRAINING
Initial implementation:
YOLO-World:
Pretrained – NO TRAINING
LLM:
Pretrained API – NO TRAINING
Counting:
Normal programming – NO TRAINING
Constraint engine:
Rules – NO TRAINING
Inventory:
Database – NO TRAINING
Recipe validator:
Rules + LLM validation – NO TRAINING
Therefore, your first complete prototype can be built without training a model.
If testing demonstrates insufficient ingredient-detection performance, then only the YOLO component is fine-tuned using your custom food dataset.
FINAL PROFESSIONAL ARCHITECTURE
         SMART PALETTE
               |
               v
      EXISTING FRONTEND
               |
      +--------+--------+
      |                 |
 Image Upload      User Constraints
      |                 |
      +--------+--------+
               |
               v
         FASTAPI BACKEND
               |
      +--------+--------+
      |                 |
      v                 v
 YOLO-WORLD         INVENTORY DB
      |
      v
 OBJECT DETECTION
 |
 v
 INGREDIENT COUNTING
 |
 v
 USER CONFIRMATION
 |
 v
 CONFIRMED INVENTORY
 |
 v
 CONSTRAINT ENGINE
 |
 v
LLM RECIPE ENGINE
 |
 v
 STRUCTURED RECIPE JSON
 |
 v
RECIPE VALIDATOR
 |
 v
EXISTING FRONTEND
 |
 v
 USER COOKS
 |
 v
 INVENTORY CONSUMPTION
 |
 v
 UPDATED INVENTORY
 |
 v
 ZERO-WASTE PRIORITY
IMMEDIATE IMPLEMENTATION ORDER
Your team should now work in this exact sequence:
Finalize the 15–20 ingredient vocabulary.
Install Python and Ultralytics.
Run pretrained YOLO-World.
Test it on real Smart Palette images.
Check whether it correctly differentiates the ingredients.
Add counting.
Generate structured JSON.
Decide whether fine-tuning is necessary.
If necessary, build and annotate the custom dataset.
Fine-tune YOLO-World.
Build the FastAPI backend.
Put the model inside the backend.
Create POST /api/v1/detect.
Connect the existing frontend to the endpoint.
Add manual correction.
Add inventory database.
Add constraint engine.
Add LLM recipe generation.
Add recipe validation.
Add inventory consumption.
Add expiry/perishability logic.
Perform complete end-to-end testing.
Deploy the final system.


