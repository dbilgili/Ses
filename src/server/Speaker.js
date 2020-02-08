const { Sonos, AsyncDeviceDiscovery } = require('sonos');

class Speaker {
  constructor() {
    this.sonos = null;
    this.subGroups = [];
  }

  findIndexByHost = (child, parentHost) => child.findIndex(item => item.host === parentHost)

  connectToKnownSpeaker = async (host, subGroups) => {
    try {
      if (!subGroups) {
        this.sonos = new Sonos(host);
        this.subGroups = [];
      } else {
        this.subGroups = subGroups.map(item => new Sonos(item.host));
        this.sonos = this.subGroups[this.findIndexByHost(this.subGroups, host)];
      }
    } catch (e) {
      throw Error(e);
    }
  }

  listSpeakers = async () => {
    try {
      const discovery = new AsyncDeviceDiscovery();
      const res = await discovery.discover();

      this.sonos = new Sonos(res.host);

      let groups = await this.sonos.getAllGroups();

      groups = groups.map((group) => {
        if (group.ZoneGroupMember.length === 1) {
          return {
            ID: group.ID,
            Name: group.Name,
            host: group.host,
            isSubGroup: false
          };
        }

        return {
          ID: group.ID,
          Name: group.Name,
          host: group.host,
          isSubGroup: false,
          subGroups: group.ZoneGroupMember.map(item => ({
            ID: item.UUID,
            Name: item.ZoneName,
            host: item.Location.split('://')[1].split(':')[0],
            isSubGroup: true
          })),
        };
      });

      return groups;
    } catch (e) {
      return [];
    }
  }
}

module.exports = Speaker;
