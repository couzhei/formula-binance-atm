## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 14.x or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the Repository**:
    ```sh
    git clone https://github.com/your-repo/formula-binance-atm.git
    cd formula-binance-atm/frontend/my-app
    ```

2. **Install Dependencies**:
    ```sh
    npm install
    ```

### Running the Development Server

1. **Start the Development Server**:
    ```sh
    npm run dev
    ```

2. **Open the App**:
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Project Structure

- **`pages/`**: Contains the pages of your application. Each file in this directory corresponds to a route.
- **`components/`**: Contains reusable components used throughout the application.
- **`public/`**: Contains static files such as images, fonts, etc.
- **`styles/`**: Contains CSS files for styling your application.

### Editing the Code

You can start working with this code by modifying `pages/chart.tsx`. The page auto-updates as you edit the file.

### Adding a New Page

1. **Create a New File**:
    Create a new file in the `pages/` directory. For example, `pages/about.tsx`.

2. **Add Content**:
    ```tsx
    import React from 'react';

    const AboutPage: React.FC = () => {
      return (
        <div>
          <h1>About Us</h1>
          <p>This is the about page.</p>
        </div>
      );
    };

    export default AboutPage;
    ```

3. **Access the Page**:
    Open [http://localhost:3000/about](http://localhost:3000/about) to see the new page.

### Deploying the App

The easiest way to deploy your Next.js app is to use [Netlify](https://www.netlify.com/).

1. **Push Your Code to GitHub**:
    Make sure your code is pushed to a GitHub repository.

2. **Create a `netlify.toml` File**:
    Create a `netlify.toml` file in the root of your project to configure the build settings for Netlify.
    ```toml
    [build]
      command = "npm run build"
      publish = ".next"

    [[redirects]]
      from = "/*"
      to = "/index.html"
      status = 200
    ```

3. **Deploy on Netlify**:
    - Go to [Netlify](https://www.netlify.com/).
    - Click on "New site from Git".
    - Connect your GitHub repository.
    - Configure the build settings:
      - **Build Command**: `npm run build`
      - **Publish Directory**: `.next`
    - Click on "Deploy site" to start the deployment process.

### Learn More

To learn more about Next.js, take a look at the following resources:
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

