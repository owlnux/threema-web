/**
 * This file is part of Threema Web.
 *
 * Threema Web is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at
 * your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 * General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Threema Web. If not, see <http://www.gnu.org/licenses/>.
 */

// tslint:disable:max-line-length

import {WebClientService} from '../services/webclient';

export default [
    function() {
        return {
            restrict: 'EA',
            scope: {},
            bindToController: {
                message: '=eeeMessage',
                multiLine: '@?multiLine',
                linkify: '@?linkify',
            },
            controllerAs: 'ctrl',
            controller: ['WebClientService', '$filter', function(webClientService: WebClientService, $filter: ng.IFilterService) {
                // Get text depending on type
                function getText(message: threema.Message): string {
                    switch (message.type) {
                        case 'text':
                            return message.body;
                        case 'location':
                            return message.location.description;
                        case 'file':
                            // Prefer caption for file messages, if available
                            if (message.caption && message.caption.length > 0) {
                                return message.caption;
                            }
                            return message.file.name;
                    }
                    return message.caption;
                }

                // TODO: Extract filters into helper functions
                const escapeHtml = $filter('escapeHtml') as any;
                const markify = $filter('markify') as any;
                const emojify = $filter('emojify') as any;
                const enlargeSingleEmoji = $filter('enlargeSingleEmoji') as any;
                const mentionify = $filter('mentionify') as any;
                const linkify = $filter('linkify') as any;
                const nlToBr = $filter('nlToBr') as any;

                /**
                 * Apply filters to text.
                 */
                function processText(text: string, largeSingleEmoji: boolean, multiLine: boolean, linkifyText: boolean): string {
                    const nonLinkified = mentionify(enlargeSingleEmoji(emojify(markify(escapeHtml(text))), enlargeSingleEmoji));
                    const maybeLinkified = linkifyText ? linkify(nonLinkified) : nonLinkified;
                    return nlToBr(maybeLinkified, multiLine);
                }

                this.enlargeSingleEmoji = webClientService.appConfig.largeSingleEmoji;

                this.$onInit = function() {
                    // Because this.multiLine and this.linkify are bound using an `@` binding,
                    // they are either undefined or a string. Convert to boolean.
                    const multiLine = (this.multiLine === undefined || this.multiLine !== 'false');
                    const linkifyText = (this.linkify === undefined || this.linkify !== 'false');

                    // Process text once, apply all filter functions
                    this.text = processText(getText(this.message), this.largeSingleEmoji, multiLine, linkifyText);
                };
            }],
            template: `
                <span click-action ng-bind-html="ctrl.text"></span>
            `,
        };
    },
];
