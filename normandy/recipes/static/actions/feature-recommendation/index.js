import {Action, registerAction} from '../utils';

export default class FeatureRecommendationAction extends Action {
    async execute() {
        this.normandy.recommendFeature(this.recipe.arguments.domain,
                                       this.recipe.arguments.recommendations);
    }
}

registerAction('feature-recommendation', FeatureRecommendationAction);
