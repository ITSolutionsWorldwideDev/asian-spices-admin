// app/platform/recipes/new/page.tsx

import RecipeForm from "../[recipeId]/RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="page-wrapper">
      <div className="content">
        <RecipeForm />
      </div>
    </div>
  );
}