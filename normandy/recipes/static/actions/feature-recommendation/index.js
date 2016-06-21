import {Action, registerAction} from '../utils';

export default class FeatureRecommendationAction extends Action {
    async execute() {
        var recCount = this.recipe.arguments.recommendations.length;
        var domain = this.recipe.arguments.domain;
        var recs = [];
        for(var i = 0; i < recCount; i++) {
          var rec = this.recipe.arguments.recommendations[i];
          recs[i] = {
            name: rec.name,
            id: rec.id,
            description: rec.description,
            packageURL: rec.packageURL,
            imageURL: rec.imageURL,
            infoURL: rec.infoURL,
          };
        }
        this.normandy.recommendFeature(domain, recs);
    }
}

registerAction('feature-recommendation', FeatureRecommendationAction);
